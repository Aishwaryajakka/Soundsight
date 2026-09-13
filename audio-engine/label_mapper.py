"""Explicit AudioSet/YAMNet to SoundSight taxonomy mapping."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Sequence, Tuple

import numpy as np


@dataclass(frozen=True)
class MappingDefinition:
    sound_type: str
    label: str
    yamnet_labels: Tuple[str, ...]
    required_labels: Tuple[str, ...] = ()


@dataclass(frozen=True)
class MappedClass:
    sound_type: str
    label: str
    raw_label: str
    confidence: float


SOUNDSIGHT_MAPPINGS: Tuple[MappingDefinition, ...] = (
    MappingDefinition("door_knock", "Door Knock", ("Knock",)),
    MappingDefinition("doorbell", "Doorbell", ("Doorbell", "Ding-dong")),
    MappingDefinition("dog_bark", "Dog Bark", ("Bark", "Dog")),
    MappingDefinition("voice", "Voice", ("Speech", "Conversation", "Narration, monologue")),
    MappingDefinition("alarm", "Alarm", ("Alarm", "Alarm clock", "Smoke detector, smoke alarm", "Fire alarm")),
    MappingDefinition("appliance_beep", "Appliance Beep", ("Beep, bleep", "Buzzer", "Microwave oven")),
    MappingDefinition("baby_crying", "Baby Crying", ("Baby cry, infant cry",)),
    MappingDefinition("car_horn", "Car Horn", ("Vehicle horn, car horn, honking",)),
    MappingDefinition("glass_breaking", "Glass Breaking", ("Breaking", "Shatter"), ("Glass",)),
    MappingDefinition("siren", "Siren", ("Siren", "Civil defense siren")),
    MappingDefinition("footsteps", "Footsteps", ("Walk, footsteps",)),
)


def scores_to_mapped_classes(scores: np.ndarray, class_names: Sequence[str]) -> list[MappedClass]:
    if scores.ndim != 1 or len(scores) != len(class_names):
        raise ValueError("YAMNet scores and class-name vocabulary have incompatible shapes.")
    indexes: Dict[str, int] = {name.casefold(): index for index, name in enumerate(class_names)}
    mapped: list[MappedClass] = []
    for definition in SOUNDSIGHT_MAPPINGS:
        candidates = [
            (float(scores[indexes[name.casefold()]]), name)
            for name in definition.yamnet_labels
            if name.casefold() in indexes
        ]
        if candidates:
            confidence, raw_label = max(candidates)
            requirements = [
                (float(scores[indexes[name.casefold()]]), name)
                for name in definition.required_labels
                if name.casefold() in indexes
            ]
            if definition.required_labels and not requirements:
                continue
            if requirements:
                required_confidence, required_label = max(requirements)
                confidence = min(confidence, required_confidence)
                raw_label = f"{required_label} + {raw_label}"
            mapped.append(MappedClass(definition.sound_type, definition.label, raw_label, confidence))
    return sorted(mapped, key=lambda item: item.confidence, reverse=True)
