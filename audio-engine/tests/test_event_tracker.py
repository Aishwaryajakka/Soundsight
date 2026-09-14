"""Deterministic tests for SoundSight event aggregation and contract output."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from classifier import Detection
from config import AudioConfig
from event_tracker import REQUIRED_FIELDS, EventTracker, validate_sound_event
from localization import LocalizationResult, center_fallback


def detection(
    confidence: float = 0.8,
    intensity: float = 0.6,
    supporting_frames: int = 2,
    sound_type: str = "door_knock",
    label: str = "Door Knock",
) -> Detection:
    return Detection(label, sound_type, "Knock", confidence, intensity, supporting_frames)


def localized(direction: str, confidence: float = 0.8) -> LocalizationResult:
    return LocalizationResult(direction, 0.0002, confidence)


class EventTrackerTests(unittest.TestCase):
    def config(self, **overrides: object) -> AudioConfig:
        values = {
            "event_required_supporting_frames": 2,
            "event_merge_duration_seconds": 2.5,
            "event_cooldown_seconds": 3.0,
            "event_confidence_alpha": 0.5,
        }
        values.update(overrides)
        return AudioConfig(**values)

    def test_repeated_frames_become_one_event(self) -> None:
        tracker = EventTracker(self.config(), id_factory=lambda: "event-one")
        outputs = [
            tracker.observe(detection(), localized("RIGHT"), now=t, epoch_ms=1_000 + int(t * 1000))
            for t in (0.0, 0.5, 1.0, 2.0)
        ]
        events = [event for event in outputs if event is not None]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["id"], "event-one")
        self.assertEqual(tracker.phase_for("door_knock"), "active")

    def test_event_expires_then_leaves_cooldown(self) -> None:
        tracker = EventTracker(self.config())
        tracker.observe(detection(), localized("CENTER"), now=0.0, epoch_ms=1000)
        tracker.tick(2.6)
        self.assertEqual(tracker.phase_for("door_knock"), "cooldown")
        tracker.tick(5.6)
        self.assertEqual(tracker.phase_for("door_knock"), "idle")

    def test_cooldown_suppresses_then_allows_new_event(self) -> None:
        identifiers = iter(("event-one", "event-two"))
        tracker = EventTracker(self.config(), id_factory=lambda: next(identifiers))
        first = tracker.observe(detection(), localized("LEFT"), now=0.0, epoch_ms=1000)
        tracker.tick(2.6)
        blocked = tracker.observe(detection(), localized("LEFT"), now=4.0, epoch_ms=4000)
        second = tracker.observe(detection(), localized("LEFT"), now=5.6, epoch_ms=5600)
        self.assertIsNotNone(first)
        self.assertIsNone(blocked)
        self.assertIsNotNone(second)
        self.assertNotEqual(first["id"], second["id"])

    def test_confidence_smoothing_and_direction_voting(self) -> None:
        tracker = EventTracker(
            self.config(event_required_supporting_frames=2), id_factory=lambda: "event-vote"
        )
        self.assertIsNone(
            tracker.observe(
                detection(confidence=0.4, intensity=0.3, supporting_frames=1),
                localized("LEFT", 0.9),
                now=0.0,
                epoch_ms=1000,
            )
        )
        event = tracker.observe(
            detection(confidence=0.8, intensity=0.7, supporting_frames=1),
            localized("RIGHT", 0.2),
            now=0.4,
            epoch_ms=1400,
        )
        self.assertIsNotNone(event)
        self.assertAlmostEqual(event["confidence"], 0.6)
        self.assertEqual(event["intensity"], 0.7)
        self.assertEqual(event["direction"], "left")
        self.assertEqual(event["angle"], 270.0)

    def test_direction_mapping_and_required_contract(self) -> None:
        expected = {"LEFT": ("left", 270.0), "CENTER": ("front", 0.0), "RIGHT": ("right", 90.0)}
        for index, (engine_direction, frontend) in enumerate(expected.items()):
            tracker = EventTracker(
                self.config(event_required_supporting_frames=1),
                id_factory=lambda index=index: f"event-{index}",
            )
            event = tracker.observe(
                detection(supporting_frames=1), localized(engine_direction), now=0.0, epoch_ms=1234567890123
            )
            self.assertIsNotNone(event)
            self.assertEqual((event["direction"], event["angle"]), frontend)
            self.assertTrue(REQUIRED_FIELDS.issubset(event.keys()))
            self.assertIsInstance(event["timestamp"], int)
            validate_sound_event(event)

    def test_voice_uses_explicit_voice_type_not_name_called(self) -> None:
        tracker = EventTracker(self.config(), id_factory=lambda: "event-voice")
        event = tracker.observe(
            detection(sound_type="voice", label="Voice"), center_fallback("mono"), now=0.0, epoch_ms=1000
        )
        self.assertEqual(event["soundType"], "voice")
        self.assertEqual(event["label"], "Voice")
        self.assertNotEqual(event["soundType"], "name_called")

    def test_default_ids_are_unique(self) -> None:
        first_tracker = EventTracker(self.config())
        second_tracker = EventTracker(self.config())
        first = first_tracker.observe(detection(), localized("CENTER"), now=0.0, epoch_ms=1000)
        second = second_tracker.observe(detection(), localized("CENTER"), now=0.0, epoch_ms=1000)
        self.assertNotEqual(first["id"], second["id"])


if __name__ == "__main__":
    unittest.main()
