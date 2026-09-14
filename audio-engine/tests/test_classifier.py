"""Deterministic classifier preprocessing and stability regression tests."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from classifier import ConfidenceThreshold, StableDetectionFilter, classification_mono, measured_dbfs, measured_intensity, top_yamnet_predictions
from config import AudioConfig
from label_mapper import MappedClass


class ClassifierPipelineTests(unittest.TestCase):
    def test_dbfs_is_microphone_relative_rms_level(self) -> None:
        self.assertAlmostEqual(measured_dbfs(np.ones(16, dtype=np.float32)), 0.0)
        self.assertAlmostEqual(measured_dbfs(np.full(16, 0.1, dtype=np.float32)), -20.0, places=4)
        self.assertEqual(measured_dbfs(np.zeros(16, dtype=np.float32)), -120.0)

    def test_stereo_mix_does_not_modify_localization_channels(self) -> None:
        stereo = np.array([[0.2, 0.6], [-0.4, 0.2]], dtype=np.float32)
        preserved = stereo.copy()

        mono = classification_mono(stereo)

        np.testing.assert_allclose(stereo, preserved)
        np.testing.assert_allclose(mono, np.array([0.4, -0.1], dtype=np.float32))

    def test_low_confidence_predictions_are_suppressed(self) -> None:
        config = AudioConfig(min_confidence=0.35, stable_windows=2, smoothing_alpha=1.0)
        stable = StableDetectionFilter(config)
        prediction = MappedClass("door_knock", "Door Knock", "Knock", 0.34)

        self.assertEqual(stable.update([prediction], intensity=0.9, now=0.0), [])
        self.assertEqual(stable.update([prediction], intensity=0.9, now=0.5), [])

    def test_two_supporting_windows_emit_once_and_keep_intensity_separate(self) -> None:
        config = AudioConfig(
            min_confidence=0.35,
            stable_windows=2,
            smoothing_alpha=1.0,
            detection_cooldown_seconds=2.0,
        )
        stable = StableDetectionFilter(config)
        # Continuous sounds retain the normal two-window stabilization path.
        prediction = MappedClass("dog_bark", "Dog Bark", "Bark", 0.8)

        self.assertEqual(stable.update([prediction], intensity=0.2, now=0.0), [])
        detections = stable.update([prediction], intensity=0.7, now=0.5)
        self.assertEqual(len(detections), 1)
        self.assertAlmostEqual(detections[0].confidence, 0.8)
        self.assertAlmostEqual(detections[0].intensity, 0.7)
        self.assertEqual(stable.update([prediction], intensity=1.0, now=1.0), [])

    def test_intensity_is_normalized_measured_energy(self) -> None:
        waveform = np.full(100, 0.05, dtype=np.float32)
        self.assertAlmostEqual(measured_intensity(waveform, reference_rms=0.1), 0.5)

    def test_live_threshold_changes_filter_behavior(self) -> None:
        config = AudioConfig(stable_windows=1, smoothing_alpha=1.0, detection_cooldown_seconds=0)
        threshold = ConfidenceThreshold(0.50)
        stable = StableDetectionFilter(config, threshold=threshold)
        prediction = MappedClass("door_knock", "Door Knock", "Knock", 0.40)
        self.assertEqual(stable.update([prediction], intensity=0.5, now=0.0), [])
        threshold.set(0.35)
        self.assertEqual(len(stable.update([prediction], intensity=0.5, now=1.0)), 1)

    def test_top_predictions_are_ranked_and_limited(self) -> None:
        predictions = top_yamnet_predictions(
            np.array([0.2, 0.9, 0.4, 0.8, 0.1, 0.7], dtype=np.float32),
            ["a", "b", "c", "d", "e", "f"],
        )
        self.assertEqual([item.label for item in predictions], ["b", "d", "f", "c", "a"])

    def test_strong_single_window_emits_only_for_short_transient(self) -> None:
        config = AudioConfig(
            min_confidence=0.35,
            stable_windows=2,
            smoothing_alpha=1.0,
            transient_high_confidence=0.60,
            detection_cooldown_seconds=0,
        )
        stable = StableDetectionFilter(config)
        knock = MappedClass("door_knock", "Door Knock", "Knock", 0.72)
        bark = MappedClass("dog_bark", "Dog Bark", "Bark", 0.92)
        self.assertEqual(len(stable.update([knock], intensity=0.5, now=0.0)), 1)
        self.assertEqual(stable.update([bark], intensity=0.5, now=0.0), [])

    def test_two_nearby_transient_windows_can_have_a_gap(self) -> None:
        config = AudioConfig(
            min_confidence=0.35,
            stable_windows=2,
            smoothing_alpha=1.0,
            transient_high_confidence=0.60,
            transient_support_window_seconds=1.2,
            detection_cooldown_seconds=0,
        )
        stable = StableDetectionFilter(config)
        glass = MappedClass("glass_breaking", "Glass Breaking", "Shatter", 0.44)
        self.assertEqual(stable.update([glass], intensity=0.5, now=0.0), [])
        self.assertEqual(stable.update([], intensity=0.1, now=0.48), [])
        detections = stable.update([glass], intensity=0.5, now=0.96)
        self.assertEqual(len(detections), 1)
        self.assertEqual(detections[0].supporting_frames, 2)


if __name__ == "__main__":
    unittest.main()
