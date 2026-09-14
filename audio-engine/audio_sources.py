"""Interchangeable local-microphone and WebSocket PCM audio sources."""

from __future__ import annotations

import queue
import threading
from typing import Optional, Protocol

import numpy as np

from audio_capture import LiveAudioCapture
from config import AudioConfig


class AudioSource(Protocol):
    sample_rate: int
    channels: int
    def start(self) -> None: ...
    def stop(self) -> None: ...
    def read(self, timeout: float = 1.0) -> np.ndarray: ...


class MicrophoneAudioSource:
    def __init__(self, config: AudioConfig) -> None:
        self.sample_rate, self.channels = config.sample_rate, config.channels
        self._capture = LiveAudioCapture(config)
    def start(self) -> None: self._capture.__enter__()
    def stop(self) -> None: self._capture.__exit__(None, None, None)
    def read(self, timeout: float = 1.0) -> np.ndarray: return self._capture.get_block(timeout)


class WebSocketAudioSource:
    """Bounded, disconnect-safe PCM queue owned by one configured client."""

    def __init__(self, max_blocks: int = 256) -> None:
        self.sample_rate, self.channels = 16_000, 1
        self._owner: Optional[int] = None
        self._queue: queue.Queue[np.ndarray] = queue.Queue(maxsize=max_blocks)
        self._lock = threading.Lock()
        self.received_samples = 0

    def start(self) -> None: pass
    def stop(self) -> None: self.clear()

    def configure(self, owner: int, sample_rate: int, channels: int, fmt: str) -> None:
        if fmt != "pcm_s16le" or channels != 1 or sample_rate != 16_000:
            raise ValueError("audio stream must be mono pcm_s16le at 16000 Hz")
        with self._lock:
            if self._owner not in (None, owner):
                raise ValueError("another client already owns the audio stream")
            self._owner = owner
            self.sample_rate, self.channels = sample_rate, channels
            self.clear()

    def push(self, owner: int, payload: bytes) -> int:
        with self._lock:
            if owner != self._owner: raise ValueError("audio_config is required before binary audio")
        if not payload or len(payload) % 2: raise ValueError("PCM frame must contain complete int16 samples")
        samples = np.frombuffer(payload, dtype="<i2").astype(np.float32).reshape(-1, 1) / 32768.0
        if not np.isfinite(samples).all(): raise ValueError("PCM frame contains invalid samples")
        if self._queue.full():
            try: self._queue.get_nowait()
            except queue.Empty: pass
        self._queue.put_nowait(samples)
        self.received_samples += len(samples)
        return len(samples)

    def read(self, timeout: float = 1.0) -> np.ndarray:
        return self._queue.get(timeout=timeout)

    def disconnect(self, owner: int) -> None:
        with self._lock:
            if owner != self._owner: return
            self._owner = None
            self.clear()

    def clear(self) -> None:
        while True:
            try: self._queue.get_nowait()
            except queue.Empty: break
