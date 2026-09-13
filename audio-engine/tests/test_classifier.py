"""Deterministic classifier preprocessing and stability regression tests."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from classifier import StableDetectionFilter, classification_mono, measured_intensity
from config import AudioConfig
from label_mapper import MappedClass


class ClassifierPipelineTests(unittest.TestCase):
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
        prediction = MappedClass("door_knock", "Door Knock", "Knock", 0.8)

        self.assertEqual(stable.update([prediction], intensity=0.2, now=0.0), [])
        detections = stable.update([prediction], intensity=0.7, now=0.5)
        self.assertEqual(len(detections), 1)
        self.assertAlmostEqual(detections[0].confidence, 0.8)
        self.assertAlmostEqual(detections[0].intensity, 0.7)
        self.assertEqual(stable.update([prediction], intensity=1.0, now=1.0), [])

    def test_intensity_is_normalized_measured_energy(self) -> None:
        waveform = np.full(100, 0.05, dtype=np.float32)
        self.assertAlmostEqual(measured_intensity(waveform, reference_rms=0.1), 0.5)


if __name__ == "__main__":
    unittest.main()
