"""Two-channel GCC-PHAT/TDOA localization for LEFT/CENTER/RIGHT only."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Deque, Optional, Tuple

import numpy as np

from config import AudioConfig


class LocalizationUnavailable(RuntimeError):
    """Raised when physical or audio requirements for localization are absent."""


@dataclass(frozen=True)
class LocalizationResult:
    direction: str
    tdoa_seconds: float
    confidence: float
    available: bool = True
    reason: Optional[str] = None

    @property
    def tdoa_ms(self) -> float:
        return self.tdoa_seconds * 1_000.0


def center_fallback(reason: str) -> LocalizationResult:
    return LocalizationResult("CENTER", 0.0, 0.0, available=False, reason=reason)


def _validate_stereo(samples: np.ndarray) -> np.ndarray:
    audio = np.asarray(samples, dtype=np.float32)
    if audio.ndim != 2 or audio.shape[1] < 2:
        raise LocalizationUnavailable("selected input has fewer than two channels")
    return audio[:, :2]


def channels_appear_duplicated(samples: np.ndarray) -> bool:
    """Detect effectively sample-identical channels, not merely a centered source."""
    stereo = _validate_stereo(samples)
    signal_rms = float(np.sqrt(np.mean(np.square(stereo.astype(np.float64)))))
    if signal_rms < 1e-7:
        return False
    difference_rms = float(
        np.sqrt(np.mean(np.square((stereo[:, 0] - stereo[:, 1]).astype(np.float64))))
    )
    return difference_rms / signal_rms < 1e-4


def gcc_phat(
    left: np.ndarray,
    right: np.ndarray,
    sample_rate: int,
    maximum_delay_s: float,
) -> Tuple[float, float]:
    """Return bounded TDOA and peak-quality confidence.

    TDOA is positive when ``right`` is delayed relative to ``left`` under this
    implementation. The hardware-facing direction for that sign remains
    configurable because device channel ordering is not universal.
    """
    first = np.asarray(left, dtype=np.float64).reshape(-1)
    second = np.asarray(right, dtype=np.float64).reshape(-1)
    if first.size == 0 or first.size != second.size:
        raise ValueError("GCC-PHAT requires equal, non-empty channel buffers.")
    if sample_rate <= 0 or maximum_delay_s <= 0:
        raise ValueError("Sample rate and maximum delay must be greater than zero.")

    first = first - np.mean(first)
    second = second - np.mean(second)
    energy = np.sqrt(np.mean(first * first) * np.mean(second * second))
    if energy < 1e-9:
        return 0.0, 0.0

    fft_size = 1 << int(np.ceil(np.log2(first.size + second.size)))
    first_fft = np.fft.rfft(first, n=fft_size)
    second_fft = np.fft.rfft(second, n=fft_size)
    cross_spectrum = first_fft * np.conj(second_fft)
    cross_spectrum /= np.maximum(np.abs(cross_spectrum), 1e-12)
    correlation = np.fft.irfft(cross_spectrum, n=fft_size)

    max_shift = min(max(1, int(np.ceil(maximum_delay_s * sample_rate))), fft_size // 2)
    bounded = np.concatenate((correlation[-max_shift:], correlation[: max_shift + 1]))
    magnitudes = np.abs(bounded)
    peak_index = int(np.argmax(magnitudes))
    shift = peak_index - max_shift

    # Sub-sample parabolic interpolation improves delays smaller than one sample.
    fractional = 0.0
    if 0 < peak_index < len(magnitudes) - 1:
        y0, y1, y2 = magnitudes[peak_index - 1 : peak_index + 2]
        denominator = y0 - 2 * y1 + y2
        if abs(denominator) > 1e-12:
            fractional = float(np.clip(0.5 * (y0 - y2) / denominator, -0.5, 0.5))

    exclusion = np.ones(len(magnitudes), dtype=bool)
    exclusion[max(0, peak_index - 2) : min(len(magnitudes), peak_index + 3)] = False
    sidelobes = magnitudes[exclusion]
    sidelobe_rms = float(np.sqrt(np.mean(sidelobes * sidelobes))) if sidelobes.size else 0.0
    peak_to_sidelobe = float(magnitudes[peak_index] / (sidelobe_rms + 1e-12))
    confidence = float(np.clip((peak_to_sidelobe - 1.0) / 9.0, 0.0, 1.0))

    # Cross-spectrum convention yields a negative shift when right is delayed.
    tdoa_seconds = -(shift + fractional) / sample_rate
    return float(np.clip(tdoa_seconds, -maximum_delay_s, maximum_delay_s)), confidence


class DirectionLocalizer:
    """GCC-PHAT localization with weighted temporal voting and safe fallbacks."""

    def __init__(self, config: AudioConfig) -> None:
        config.validate()
        if config.microphone_spacing_m is None:
            raise LocalizationUnavailable(
                "microphone spacing is unknown; measure it and pass --mic-spacing METERS"
            )
        self.config = config
        self.maximum_delay_s = config.microphone_spacing_m / config.speed_of_sound_m_s
        if config.center_dead_zone_s >= self.maximum_delay_s:
            raise ValueError(
                "Center dead-zone must be smaller than spacing / speed of sound "
                f"({self.maximum_delay_s * 1000:.3f} ms)."
            )
        self._history: Deque[Tuple[str, float, float]] = deque(
            maxlen=config.localization_smoothing_windows
        )

    def _raw_direction(self, corrected_tdoa: float) -> str:
        if abs(corrected_tdoa) <= self.config.center_dead_zone_s:
            return "CENTER"
        positive = self.config.positive_tdoa_direction.upper()
        if corrected_tdoa > 0:
            return positive
        return "RIGHT" if positive == "LEFT" else "LEFT"

    def process(self, samples: np.ndarray, sample_rate: int) -> LocalizationResult:
        stereo = _validate_stereo(samples)
        if self.config.swap_channels:
            stereo = stereo[:, ::-1]
        if channels_appear_duplicated(stereo):
            return center_fallback("input channels appear to be duplicated mono")

        tdoa, peak_confidence = gcc_phat(
            stereo[:, 0], stereo[:, 1], sample_rate, self.maximum_delay_s
        )
        corrected = float(
            np.clip(
                tdoa - self.config.calibration_offset_s,
                -self.maximum_delay_s,
                self.maximum_delay_s,
            )
        )
        raw_direction = self._raw_direction(corrected)
        self._history.append((raw_direction, corrected, peak_confidence))

        weights = {"LEFT": 0.0, "CENTER": 0.0, "RIGHT": 0.0}
        for direction, _, confidence in self._history:
            weights[direction] += max(confidence, 0.05)
        direction = max(weights, key=weights.get)
        matching = [entry for entry in self._history if entry[0] == direction]
        direction_weight = weights[direction]
        total_weight = sum(weights.values())
        vote_consistency = direction_weight / total_weight if total_weight else 0.0
        mean_peak_quality = float(np.mean([entry[2] for entry in matching]))
        confidence = float(np.clip(mean_peak_quality * vote_consistency, 0.0, 1.0))
        smoothed_tdoa = float(np.median([entry[1] for entry in matching]))
        return LocalizationResult(direction, smoothed_tdoa, confidence)


def synthetic_delay_signal(
    sample_rate: int,
    delay_samples: int,
    frames: int = 4096,
    seed: int = 7,
) -> np.ndarray:
    """Create deterministic broadband stereo data for GCC-PHAT validation."""
    rng = np.random.default_rng(seed)
    source = rng.normal(0.0, 0.2, frames + abs(delay_samples)).astype(np.float32)
    if delay_samples > 0:  # right channel arrives later
        left = source[:frames]
        right = source[delay_samples : delay_samples + frames]
        # The slicing above advances right; reverse assignment for an actual delay.
        right = np.pad(left, (delay_samples, 0))[:frames]
    elif delay_samples < 0:  # left channel arrives later
        right = source[:frames]
        left = np.pad(right, (-delay_samples, 0))[:frames]
    else:
        left = source[:frames]
        right = left.copy()
    return np.column_stack((left, right))
