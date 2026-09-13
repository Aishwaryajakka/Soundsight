"""Deterministic Phase 3 tests using known artificial stereo delays."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import AudioConfig
from localization import DirectionLocalizer, gcc_phat, synthetic_delay_signal


class GccPhatTests(unittest.TestCase):
    sample_rate = 48_000
    spacing = 0.20

    def config(self, **overrides: object) -> AudioConfig:
        values = {
            "microphone_spacing_m": self.spacing,
            "center_dead_zone_s": 0.00008,
            "localization_smoothing_windows": 1,
        }
        values.update(overrides)
        return AudioConfig(**values)

    def test_known_delays_and_physical_bound(self) -> None:
        maximum_delay = self.spacing / 343.0
        for delay_samples in (-12, 12):
            stereo = synthetic_delay_signal(self.sample_rate, delay_samples)
            tdoa, confidence = gcc_phat(
                stereo[:, 0], stereo[:, 1], self.sample_rate, maximum_delay
            )
            self.assertAlmostEqual(tdoa, delay_samples / self.sample_rate, places=5)
            self.assertLessEqual(abs(tdoa), maximum_delay)
            self.assertGreater(confidence, 0.8)

    def test_left_center_right(self) -> None:
        localizer = DirectionLocalizer(self.config())
        self.assertEqual(
            localizer.process(synthetic_delay_signal(self.sample_rate, 12), self.sample_rate).direction,
            "LEFT",
        )
        localizer = DirectionLocalizer(self.config())
        self.assertEqual(
            localizer.process(synthetic_delay_signal(self.sample_rate, -12), self.sample_rate).direction,
            "RIGHT",
        )

        rng = np.random.default_rng(21)
        center = rng.normal(0, 0.2, 4096).astype(np.float32)
        independent_noise = rng.normal(0, 0.0005, 4096).astype(np.float32)
        center_stereo = np.column_stack((center, center + independent_noise))
        localizer = DirectionLocalizer(self.config())
        result = localizer.process(center_stereo, self.sample_rate)
        self.assertTrue(result.available)
        self.assertEqual(result.direction, "CENTER")

    def test_swap_channels_reverses_side(self) -> None:
        stereo = synthetic_delay_signal(self.sample_rate, 12)
        normal = DirectionLocalizer(self.config()).process(stereo, self.sample_rate)
        swapped = DirectionLocalizer(self.config(swap_channels=True)).process(
            stereo, self.sample_rate
        )
        self.assertEqual(normal.direction, "LEFT")
        self.assertEqual(swapped.direction, "RIGHT")

    def test_duplicated_mono_is_unavailable(self) -> None:
        mono = np.random.default_rng(4).normal(0, 0.2, 4096).astype(np.float32)
        duplicated = np.column_stack((mono, mono))
        result = DirectionLocalizer(self.config()).process(duplicated, self.sample_rate)
        self.assertFalse(result.available)
        self.assertEqual(result.direction, "CENTER")
        self.assertEqual(result.confidence, 0.0)


if __name__ == "__main__":
    unittest.main()
