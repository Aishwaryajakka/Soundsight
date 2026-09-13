"""Aggregate stable classifier/localizer output into frontend-compatible SoundEvents."""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Literal, Optional, TypedDict

import numpy as np

from classifier import Detection
from config import AudioConfig
from localization import LocalizationResult

SoundType = Literal[
    "door_knock",
    "doorbell",
    "name_called",
    "alarm",
    "appliance_beep",
    "dog_bark",
    "baby_crying",
    "car_horn",
    "glass_breaking",
    "siren",
    "footsteps",
    "custom",
    "other",
]
SoundDirection = Literal[
    "front", "right", "left", "back", "front_right", "front_left", "back_right", "back_left"
]
SoundPriority = Literal["critical", "high", "normal", "info"]
SoundCategory = Literal["safety", "speech", "household", "outdoor"]
EventPhase = Literal["idle", "candidate", "active", "cooldown"]


class SoundEvent(TypedDict):
    """Exact Python mirror of the supported frontend SoundEvent fields."""

    id: str
    soundType: SoundType
    label: str
    direction: SoundDirection
    confidence: float
    intensity: float
    priority: SoundPriority
    timestamp: int
    isActive: bool
    angle: float
    category: SoundCategory
    iconName: str
    description: str


VALID_SOUND_TYPES = {
    "door_knock", "doorbell", "name_called", "alarm", "appliance_beep", "dog_bark",
    "baby_crying", "car_horn", "glass_breaking", "siren", "footsteps", "custom", "other",
}
VALID_DIRECTIONS = {
    "front", "right", "left", "back", "front_right", "front_left", "back_right", "back_left",
}
VALID_PRIORITIES = {"critical", "high", "normal", "info"}
VALID_CATEGORIES = {"safety", "speech", "household", "outdoor"}
REQUIRED_FIELDS = {
    "id", "soundType", "label", "direction", "confidence", "intensity", "priority", "timestamp", "isActive",
}
ALLOWED_FIELDS = REQUIRED_FIELDS | {"angle", "category", "iconName", "description"}

PRIORITIES: Dict[str, SoundPriority] = {
    "alarm": "critical", "siren": "critical", "glass_breaking": "critical",
    "door_knock": "normal", "doorbell": "normal", "dog_bark": "normal", "car_horn": "normal",
}
CATEGORIES: Dict[str, SoundCategory] = {
    "alarm": "safety", "siren": "safety", "glass_breaking": "safety",
    "name_called": "speech", "baby_crying": "speech", "footsteps": "speech",
    "car_horn": "outdoor",
}
ICONS = {
    "door_knock": "DoorClosed", "doorbell": "Bell", "name_called": "Volume2",
    "appliance_beep": "Microwave", "dog_bark": "ShieldAlert", "alarm": "Flame",
    "baby_crying": "Baby", "siren": "Siren", "car_horn": "Car",
}
DIRECTION_MAP = {
    "LEFT": ("left", 270.0), "CENTER": ("front", 0.0), "RIGHT": ("right", 90.0),
}


@dataclass
class _TrackedSound:
    phase: EventPhase = "idle"
    event_id: Optional[str] = None
    label: str = ""
    supporting_frames: int = 0
    confidence: float = 0.0
    intensity: float = 0.0
    first_seen: float = 0.0
    last_seen: float = 0.0
    cooldown_until: float = 0.0
    direction_votes: Dict[str, float] = field(
        default_factory=lambda: {"LEFT": 0.0, "CENTER": 0.0, "RIGHT": 0.0}
    )


def validate_sound_event(event: SoundEvent) -> None:
    missing = REQUIRED_FIELDS - set(event)
    if missing:
        raise ValueError(f"SoundEvent is missing required fields: {sorted(missing)}")
    extra = set(event) - ALLOWED_FIELDS
    if extra:
        raise ValueError(f"SoundEvent contains unsupported fields: {sorted(extra)}")
    if event["soundType"] not in VALID_SOUND_TYPES:
        raise ValueError(f"Invalid SoundEvent soundType: {event['soundType']}")
    if event["direction"] not in VALID_DIRECTIONS:
        raise ValueError(f"Invalid SoundEvent direction: {event['direction']}")
    if event["priority"] not in VALID_PRIORITIES:
        raise ValueError(f"Invalid SoundEvent priority: {event['priority']}")
    if event["category"] not in VALID_CATEGORIES:
        raise ValueError(f"Invalid SoundEvent category: {event['category']}")
    if not 0.0 <= event["confidence"] <= 1.0 or not 0.0 <= event["intensity"] <= 1.0:
        raise ValueError("SoundEvent confidence and intensity must be between zero and one.")
    if not isinstance(event["timestamp"], int):
        raise ValueError("SoundEvent timestamp must be Unix epoch milliseconds as an integer.")


class EventTracker:
    """Per-sound idle → candidate → active → cooldown state machine."""

    def __init__(self, config: AudioConfig, id_factory=None) -> None:
        config.validate()
        self.config = config
        self._states: Dict[str, _TrackedSound] = {}
        self._id_factory = id_factory or (lambda: f"event-{uuid.uuid4()}")

    @staticmethod
    def _frontend_sound_type(sound_type: str) -> SoundType:
        # The current TypeScript union has no `voice`; retain an honest label but
        # use its supported catch-all type. Never imply name recognition.
        return "other" if sound_type == "voice" else sound_type  # type: ignore[return-value]

    def _add_observation(
        self,
        state: _TrackedSound,
        detection: Detection,
        localization: LocalizationResult,
        now: float,
    ) -> None:
        alpha = self.config.event_confidence_alpha
        if state.supporting_frames == 0:
            state.confidence = detection.confidence
            state.intensity = detection.intensity
        else:
            state.confidence = alpha * detection.confidence + (1 - alpha) * state.confidence
            state.intensity = max(state.intensity, detection.intensity)
        state.label = detection.label
        state.supporting_frames += max(1, detection.supporting_frames)
        state.last_seen = now
        direction = localization.direction if localization.direction in DIRECTION_MAP else "CENTER"
        # An unavailable localization still provides a low-weight safe CENTER fallback.
        state.direction_votes[direction] += max(localization.confidence, 0.05)

    def _build_event(self, sound_type: str, state: _TrackedSound, epoch_ms: int) -> SoundEvent:
        frontend_type = self._frontend_sound_type(sound_type)
        direction_key = max(state.direction_votes, key=state.direction_votes.get)
        direction, angle = DIRECTION_MAP[direction_key]
        category: SoundCategory
        if sound_type == "voice":
            category = "speech"
        else:
            category = CATEGORIES.get(frontend_type, "household")
        icon = "Volume2" if sound_type == "voice" else ICONS.get(frontend_type, "AlertCircle")
        event: SoundEvent = {
            "id": state.event_id or self._id_factory(),
            "soundType": frontend_type,
            "label": state.label,
            "direction": direction,  # type: ignore[typeddict-item]
            "confidence": round(float(np.clip(state.confidence, 0.0, 1.0)), 4),
            "intensity": round(float(np.clip(state.intensity, 0.0, 1.0)), 4),
            "priority": PRIORITIES.get(frontend_type, "info"),
            "timestamp": int(epoch_ms),
            "isActive": True,
            "angle": angle,
            "category": category,
            "iconName": icon,
            "description": f"{state.label} detected.",
        }
        validate_sound_event(event)
        return event

    def observe(
        self,
        detection: Detection,
        localization: LocalizationResult,
        now: Optional[float] = None,
        epoch_ms: Optional[int] = None,
    ) -> Optional[SoundEvent]:
        monotonic_now = time.monotonic() if now is None else now
        event_time = int(time.time() * 1000) if epoch_ms is None else int(epoch_ms)
        sound_type = detection.sound_type
        state = self._states.setdefault(sound_type, _TrackedSound())

        if state.phase == "active" and monotonic_now - state.last_seen > self.config.event_merge_duration_seconds:
            self._enter_cooldown(state)
        if state.phase == "cooldown":
            if monotonic_now < state.cooldown_until:
                return None
            self._reset(state)
        if state.phase == "candidate" and monotonic_now - state.last_seen > self.config.event_candidate_timeout_seconds:
            self._reset(state)

        if state.phase == "idle":
            state.phase = "candidate"
            state.first_seen = monotonic_now
            state.last_seen = monotonic_now
        self._add_observation(state, detection, localization, monotonic_now)

        if state.phase == "candidate" and state.supporting_frames >= self.config.event_required_supporting_frames:
            state.phase = "active"
            state.event_id = self._id_factory()
            return self._build_event(sound_type, state, event_time)
        # Repeated observations merge into the active event without re-emission.
        return None

    def _enter_cooldown(self, state: _TrackedSound) -> None:
        state.phase = "cooldown"
        state.cooldown_until = state.last_seen + self.config.event_merge_duration_seconds + self.config.event_cooldown_seconds

    @staticmethod
    def _reset(state: _TrackedSound) -> None:
        state.phase = "idle"
        state.event_id = None
        state.label = ""
        state.supporting_frames = 0
        state.confidence = 0.0
        state.intensity = 0.0
        state.first_seen = 0.0
        state.last_seen = 0.0
        state.cooldown_until = 0.0
        state.direction_votes = {"LEFT": 0.0, "CENTER": 0.0, "RIGHT": 0.0}

    def tick(self, now: Optional[float] = None) -> None:
        monotonic_now = time.monotonic() if now is None else now
        for state in self._states.values():
            if state.phase == "candidate" and monotonic_now - state.last_seen > self.config.event_candidate_timeout_seconds:
                self._reset(state)
            elif state.phase == "active" and monotonic_now - state.last_seen > self.config.event_merge_duration_seconds:
                self._enter_cooldown(state)
            elif state.phase == "cooldown" and monotonic_now >= state.cooldown_until:
                self._reset(state)

    def phase_for(self, sound_type: str) -> EventPhase:
        return self._states.get(sound_type, _TrackedSound()).phase


def print_new_event(event: SoundEvent) -> None:
    print("\nNEW EVENT\n")
    print(json.dumps(event, indent=2))
