"""Configuration for the SoundSight microphone capture prototype."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional


@dataclass(frozen=True)
class AudioConfig:
    """Runtime audio settings; ``None`` selects the system default input."""

    device: Optional[int] = None
    sample_rate: int = 48_000
    block_size: int = 960
    channels: int = 2
    output_interval: float = 0.5
    model_sample_rate: int = 16_000
    inference_window_seconds: float = 0.975
    inference_hop_seconds: float = 0.48
    min_confidence: float = 0.35
    smoothing_alpha: float = 0.45
    stable_windows: int = 2
    detection_cooldown_seconds: float = 2.0
    transient_high_confidence: float = 0.60
    transient_support_window_seconds: float = 1.20
    debug_predictions: bool = False
    intensity_reference_rms: float = 0.1
    # No physical spacing can be inferred from an OS device index. Measure the
    # selected stereo array and pass --mic-spacing before enabling localization.
    microphone_spacing_m: Optional[float] = None
    speed_of_sound_m_s: float = 343.0
    center_dead_zone_s: float = 0.00008
    calibration_offset_s: float = 0.0
    localization_smoothing_windows: int = 5
    swap_channels: bool = False
    positive_tdoa_direction: Literal["left", "right"] = "left"
    event_required_supporting_frames: int = 2
    event_candidate_timeout_seconds: float = 2.0
    event_merge_duration_seconds: float = 2.5
    event_cooldown_seconds: float = 3.0
    event_confidence_alpha: float = 0.45
    websocket_host: str = "0.0.0.0"
    websocket_port: int = 8765
    websocket_path: str = "/events"
    websocket_client_queue_size: int = 32
    websocket_ping_interval_seconds: float = 20.0
    websocket_ping_timeout_seconds: float = 20.0
    transcription_model: str = "tiny.en"
    transcription_window_seconds: float = 3.0

    def validate(self) -> None:
        if self.device is not None and self.device < 0:
            raise ValueError("Device index must be zero or greater.")
        if self.sample_rate <= 0:
            raise ValueError("Sample rate must be greater than zero.")
        if self.block_size <= 0:
            raise ValueError("Block size must be greater than zero.")
        if self.channels not in (1, 2):
            raise ValueError("Channel count must be 1 (mono) or 2 (stereo).")
        if self.output_interval <= 0:
            raise ValueError("Output interval must be greater than zero.")
        if self.model_sample_rate != 16_000:
            raise ValueError("YAMNet requires a 16000 Hz model sample rate.")
        if self.inference_window_seconds < 0.975:
            raise ValueError("YAMNet inference windows must be at least 0.975 seconds.")
        if not 0 < self.inference_hop_seconds <= self.inference_window_seconds:
            raise ValueError("Inference hop must be positive and no longer than the window.")
        if not 0 <= self.min_confidence <= 1:
            raise ValueError("Minimum confidence must be between zero and one.")
        if not 0 < self.smoothing_alpha <= 1:
            raise ValueError("Smoothing alpha must be greater than zero and at most one.")
        if self.stable_windows < 1:
            raise ValueError("Stable windows must be at least one.")
        if self.detection_cooldown_seconds < 0:
            raise ValueError("Detection cooldown cannot be negative.")
        if not 0 <= self.transient_high_confidence <= 1:
            raise ValueError("Transient high confidence must be between zero and one.")
        if self.transient_support_window_seconds <= 0:
            raise ValueError("Transient support window must be greater than zero.")
        if self.intensity_reference_rms <= 0:
            raise ValueError("Intensity reference RMS must be greater than zero.")
        if self.microphone_spacing_m is not None and self.microphone_spacing_m <= 0:
            raise ValueError("Microphone spacing must be greater than zero meters.")
        if self.speed_of_sound_m_s <= 0:
            raise ValueError("Speed of sound must be greater than zero.")
        if self.center_dead_zone_s < 0:
            raise ValueError("Center dead-zone cannot be negative.")
        if self.localization_smoothing_windows < 1:
            raise ValueError("Localization smoothing windows must be at least one.")
        if self.positive_tdoa_direction not in ("left", "right"):
            raise ValueError("Positive TDOA direction must be 'left' or 'right'.")
        if self.event_required_supporting_frames < 1:
            raise ValueError("Event supporting-frame requirement must be at least one.")
        if self.event_candidate_timeout_seconds <= 0:
            raise ValueError("Event candidate timeout must be greater than zero.")
        if self.event_merge_duration_seconds <= 0:
            raise ValueError("Event merge duration must be greater than zero.")
        if self.event_cooldown_seconds < 0:
            raise ValueError("Event cooldown cannot be negative.")
        if not 0 < self.event_confidence_alpha <= 1:
            raise ValueError("Event confidence alpha must be greater than zero and at most one.")
        if not self.websocket_host:
            raise ValueError("WebSocket host cannot be empty.")
        if not 0 <= self.websocket_port <= 65535:
            raise ValueError("WebSocket port must be between 0 and 65535 (0 is test-only auto-selection).")
        if not self.websocket_path.startswith("/"):
            raise ValueError("WebSocket path must begin with '/'.")
        if self.websocket_client_queue_size < 1:
            raise ValueError("WebSocket client queue size must be at least one.")
        if self.websocket_ping_interval_seconds <= 0 or self.websocket_ping_timeout_seconds <= 0:
            raise ValueError("WebSocket heartbeat values must be greater than zero.")
        if not self.transcription_model or self.transcription_window_seconds < 1.0:
            raise ValueError("Transcription model is required and its window must be at least one second.")
