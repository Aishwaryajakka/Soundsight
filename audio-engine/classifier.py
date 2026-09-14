"""Official TensorFlow Hub YAMNet inference and stable detection filtering."""

from __future__ import annotations

import csv
import os
import time
import threading
from dataclasses import dataclass
from fractions import Fraction
from typing import Dict, Iterable, Iterator, Optional, Sequence

import numpy as np
from scipy.signal import resample_poly

from config import AudioConfig
from label_mapper import MappedClass, scores_to_mapped_classes

YAMNET_MODEL_URL = "https://tfhub.dev/google/yamnet/1"


class ClassificationError(RuntimeError):
    """Raised when model loading or audio classification fails."""


@dataclass(frozen=True)
class Detection:
    label: str
    sound_type: str
    raw_label: str
    confidence: float
    intensity: float
    supporting_frames: int = 1


class ConfidenceThreshold:
    """Thread-safe live classifier threshold shared with the control server."""

    def __init__(self, value: float) -> None:
        self._lock = threading.Lock()
        self._value = 0.0
        self.set(value)

    def get(self) -> float:
        with self._lock:
            return self._value

    def set(self, value: float) -> None:
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 1:
            raise ValueError("Minimum confidence must be a number between zero and one.")
        with self._lock:
            self._value = float(value)


def classification_mono(samples: np.ndarray) -> np.ndarray:
    """Return a new mono float32 array; the original channel data is untouched."""
    audio = np.asarray(samples, dtype=np.float32)
    if audio.ndim == 1:
        return audio.copy()
    if audio.ndim != 2 or audio.shape[1] < 1:
        raise ValueError("Audio must be frames or frames x channels.")
    return np.mean(audio, axis=1, dtype=np.float32)


def resample_for_yamnet(samples: np.ndarray, source_rate: int, target_rate: int = 16_000) -> np.ndarray:
    if source_rate <= 0 or target_rate <= 0:
        raise ValueError("Sample rates must be greater than zero.")
    mono = classification_mono(samples)
    if source_rate == target_rate:
        return mono
    ratio = Fraction(target_rate, source_rate)
    result = resample_poly(mono, ratio.numerator, ratio.denominator)
    return np.asarray(result, dtype=np.float32)


def measured_intensity(samples: np.ndarray, reference_rms: float) -> float:
    """Return RMS energy relative to a configurable full-intensity reference."""
    audio = np.asarray(samples, dtype=np.float32)
    if audio.size == 0:
        return 0.0
    rms = float(np.sqrt(np.mean(np.square(audio.astype(np.float64, copy=False)))))
    return float(np.clip(rms / reference_rms, 0.0, 1.0))


class YamNetClassifier:
    """Lazy-loading wrapper around google/yamnet/1 from TensorFlow Hub."""

    def __init__(self, model_url: str = YAMNET_MODEL_URL) -> None:
        self.model_url = model_url
        self._model = None
        self._class_names: Optional[Sequence[str]] = None

    def load(self) -> None:
        if self._model is not None:
            return
        os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
        os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
        try:
            import tensorflow_hub as hub

            self._model = hub.load(self.model_url)
            class_map_path = self._model.class_map_path().numpy().decode("utf-8")
            with open(class_map_path, newline="", encoding="utf-8") as handle:
                self._class_names = tuple(row[2] for row in list(csv.reader(handle))[1:])
        except Exception as exc:
            raise ClassificationError(
                f"Unable to load official YAMNet model '{self.model_url}': {exc}"
            ) from exc

    @property
    def class_names(self) -> Sequence[str]:
        self.load()
        assert self._class_names is not None
        return self._class_names

    def predict(self, waveform_16khz: np.ndarray) -> list[MappedClass]:
        self.load()
        assert self._model is not None
        waveform = np.asarray(waveform_16khz, dtype=np.float32).reshape(-1)
        minimum_samples = 15_600  # first YAMNet frame requires 0.975 s at 16 kHz
        if waveform.size < minimum_samples:
            waveform = np.pad(waveform, (0, minimum_samples - waveform.size))
        try:
            scores, _, _ = self._model(waveform)
            frame_scores = np.asarray(scores.numpy(), dtype=np.float32)
        except Exception as exc:
            raise ClassificationError(f"YAMNet inference failed: {exc}") from exc
        # Preserve model certainty: aggregate temporal model outputs, never substitute loudness.
        aggregate_scores = np.max(frame_scores, axis=0)
        return scores_to_mapped_classes(aggregate_scores, self.class_names)


class StableDetectionFilter:
    """EMA smoothing plus consecutive-window gating and per-class cooldown."""

    def __init__(self, config: AudioConfig, threshold: Optional[ConfidenceThreshold] = None) -> None:
        self.config = config
        self.threshold = threshold or ConfidenceThreshold(config.min_confidence)
        self._ema: Dict[str, float] = {}
        self._streaks: Dict[str, int] = {}
        self._last_emitted: Dict[str, float] = {}

    def update(
        self,
        predictions: Iterable[MappedClass],
        intensity: float,
        now: Optional[float] = None,
    ) -> list[Detection]:
        timestamp = time.monotonic() if now is None else now
        by_type = {prediction.sound_type: prediction for prediction in predictions}
        detections: list[Detection] = []

        for sound_type in set(self._ema) | set(by_type):
            prediction = by_type.get(sound_type)
            raw_confidence = prediction.confidence if prediction else 0.0
            previous = self._ema.get(sound_type, raw_confidence)
            smoothed = self.config.smoothing_alpha * raw_confidence + (1 - self.config.smoothing_alpha) * previous
            self._ema[sound_type] = smoothed
            self._streaks[sound_type] = self._streaks.get(sound_type, 0) + 1 if smoothed >= self.threshold.get() else 0

            last_emitted = self._last_emitted.get(sound_type, float("-inf"))
            if (
                prediction is not None
                and self._streaks[sound_type] >= self.config.stable_windows
                and timestamp - last_emitted >= self.config.detection_cooldown_seconds
            ):
                detections.append(
                    Detection(
                        label=prediction.label,
                        sound_type=sound_type,
                        raw_label=prediction.raw_label,
                        confidence=float(np.clip(smoothed, 0.0, 1.0)),
                        intensity=float(np.clip(intensity, 0.0, 1.0)),
                        supporting_frames=self.config.stable_windows,
                    )
                )
                self._last_emitted[sound_type] = timestamp
                self._streaks[sound_type] = 0
        return sorted(detections, key=lambda item: item.confidence, reverse=True)


def iter_windows(samples: np.ndarray, sample_rate: int, window_seconds: float, hop_seconds: float) -> Iterator[np.ndarray]:
    window_frames = int(round(window_seconds * sample_rate))
    hop_frames = int(round(hop_seconds * sample_rate))
    if samples.ndim == 1:
        samples = samples[:, np.newaxis]
    if len(samples) == 0:
        return
    start = 0
    while start < len(samples):
        window = samples[start : start + window_frames]
        if len(window) < window_frames:
            window = np.pad(window, ((0, window_frames - len(window)), (0, 0)))
        yield window
        if start + window_frames >= len(samples):
            break
        start += hop_frames


def classify_window(
    classifier: YamNetClassifier,
    detection_filter: StableDetectionFilter,
    original_channels: np.ndarray,
    source_rate: int,
    config: AudioConfig,
    now: Optional[float] = None,
) -> list[Detection]:
    mono_16khz = resample_for_yamnet(original_channels, source_rate, config.model_sample_rate)
    predictions = classifier.predict(mono_16khz)
    intensity = measured_intensity(original_channels, config.intensity_reference_rms)
    return detection_filter.update(predictions, intensity, now)


def print_detection(detection: Detection, localization: object = None) -> None:
    print("\nDETECTED")
    print(f"label: {detection.label}")
    print(f"soundType: {detection.sound_type}")
    print(f"raw_label: {detection.raw_label}")
    print(f"confidence: {detection.confidence:.2f}")
    print(f"intensity: {detection.intensity:.2f}")
    if localization is not None:
        print(f"direction: {localization.direction}")
        print(f"localization_confidence: {localization.confidence:.2f}")
