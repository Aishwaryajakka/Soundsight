"""Regression coverage for SoundSight's exact YAMNet vocabulary mappings."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from label_mapper import scores_to_mapped_classes


class LabelMapperTests(unittest.TestCase):
    def mapped_type(self, raw_label: str) -> str:
        mapped = scores_to_mapped_classes(np.array([0.8], dtype=np.float32), [raw_label])
        self.assertEqual(len(mapped), 1, raw_label)
        return mapped[0].sound_type

    def test_requested_sound_mappings_use_exact_yamnet_labels(self) -> None:
        expected = {
            "Knock": "door_knock",
            "Doorbell": "doorbell",
            "Singing": "singing",
            "Choir": "singing",
            "Vocal music": "singing",
            "Shatter": "glass_breaking",
            "Bark": "dog_bark",
            "Dog": "dog_bark",
            "Alarm": "alarm",
            "Car alarm": "alarm",
            "Smoke detector, smoke alarm": "alarm",
            "Siren": "siren",
            "Ambulance (siren)": "siren",
            "Speech": "voice",
            "Child speech, kid speaking": "voice",
            "Conversation": "voice",
        }
        for raw_label, sound_type in expected.items():
            with self.subTest(raw_label=raw_label):
                self.assertEqual(self.mapped_type(raw_label), sound_type)

    def test_generic_music_and_breaking_are_not_misleadingly_mapped(self) -> None:
        scores = np.array([0.95, 0.90], dtype=np.float32)
        self.assertEqual(scores_to_mapped_classes(scores, ["Music", "Breaking"]), [])


if __name__ == "__main__":
    unittest.main()
