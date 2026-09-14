"""Bounded local faster-whisper worker fed by the existing microphone stream."""
from __future__ import annotations

import queue
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Callable, Optional, TypedDict
import numpy as np
from classifier import classification_mono, resample_for_yamnet

class TranscriptSegment(TypedDict):
    id: str
    text: str
    timestamp: int
    isFinal: bool

def validate_transcript_segment(segment: object) -> None:
    if not isinstance(segment, dict) or set(segment) != {"id", "text", "timestamp", "isFinal"}:
        raise ValueError("TranscriptSegment has invalid fields.")
    if not isinstance(segment["id"], str) or not segment["id"].strip():
        raise ValueError("TranscriptSegment id is invalid.")
    if not isinstance(segment["text"], str) or not segment["text"].strip():
        raise ValueError("TranscriptSegment text cannot be empty.")
    if not isinstance(segment["timestamp"], int) or segment["timestamp"] < 0 or not isinstance(segment["isFinal"], bool):
        raise ValueError("TranscriptSegment timestamp/isFinal is invalid.")

class LocalTranscriber:
    """Lazy local STT worker. Audio is never written to disk or sent to a cloud API."""
    def __init__(self, model_name: str = "tiny.en", window_seconds: float = 3.0, model_factory: Optional[Callable[[], Any]] = None) -> None:
        self.model_name, self.window_seconds = model_name, window_seconds
        self._model_factory = model_factory
        self._queue: queue.Queue[tuple[np.ndarray, int]] = queue.Queue(maxsize=32)
        self._enabled, self._paused, self._stop = threading.Event(), threading.Event(), threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._on_segment: Optional[Callable[[TranscriptSegment], None]] = None
        self._on_status: Optional[Callable[[str], None]] = None

    def start(self, on_segment: Callable[[TranscriptSegment], None], on_status: Callable[[str], None]) -> None:
        if self._thread is not None: return
        self._on_segment, self._on_status = on_segment, on_status
        self._thread = threading.Thread(target=self._run, name="soundsight-transcriber", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread is not None: self._thread.join(timeout=5)

    def configure(self, enabled: bool, paused: bool = False) -> None:
        self._enabled.set() if enabled else self._enabled.clear()
        self._paused.set() if paused else self._paused.clear()
        if not enabled: self._drain()

    def submit(self, samples: np.ndarray, sample_rate: int) -> None:
        if not self._enabled.is_set() or self._paused.is_set(): return
        item = (np.asarray(samples, dtype=np.float32).copy(), sample_rate)
        if self._queue.full():
            try: self._queue.get_nowait()
            except queue.Empty: pass
        self._queue.put_nowait(item)

    def _drain(self) -> None:
        while True:
            try: self._queue.get_nowait()
            except queue.Empty: return

    def _status(self, value: str) -> None:
        if self._on_status is not None: self._on_status(value)

    def _run(self) -> None:
        model, buffered = None, np.empty(0, dtype=np.float32)
        target_frames = int(16_000 * self.window_seconds)
        while not self._stop.is_set():
            if not self._enabled.wait(timeout=0.25):
                buffered = np.empty(0, dtype=np.float32); continue
            if model is None:
                try:
                    self._status("processing")
                    print(f"[STT] loading faster-whisper model: {self.model_name}", flush=True)
                    if self._model_factory is not None:
                        model = self._model_factory()
                    else:
                        from faster_whisper import WhisperModel
                        model = WhisperModel(self.model_name, device="cpu", compute_type="int8", download_root=str(Path(__file__).parent / "models"))
                    print("[STT] model ready", flush=True)
                    self._status("listening")
                except Exception as exc:
                    self._status("offline"); print(f"[STT] unavailable: {exc}", flush=True); self._enabled.clear(); continue
            try: samples, rate = self._queue.get(timeout=0.25)
            except queue.Empty: continue
            if self._paused.is_set(): buffered = np.empty(0, dtype=np.float32); continue
            buffered = np.concatenate((buffered, resample_for_yamnet(classification_mono(samples), rate, 16_000)))
            if len(buffered) < target_frames: continue
            audio, buffered = buffered[:target_frames], buffered[target_frames:]
            rms = float(np.sqrt(np.mean(np.square(audio.astype(np.float64, copy=False)))))
            peak = float(np.max(np.abs(audio))) if audio.size else 0.0
            print(f"[STT] received speech window: {len(audio) / 16_000:.1f}s RMS {rms:.4f} Peak {peak:.4f}", flush=True)
            self._status("processing")
            print("[STT] transcribing...", flush=True)
            try:
                segments, _ = model.transcribe(audio, language="en", beam_size=1, vad_filter=True, condition_on_previous_text=False)
                text = " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()
                if text and self._on_segment is not None:
                    message: TranscriptSegment = {"id": f"transcript-{uuid.uuid4()}", "text": text, "timestamp": int(time.time() * 1000), "isFinal": True}
                    validate_transcript_segment(message)
                    print(f"[STT] result: {text!r}", flush=True)
                    self._on_segment(message)
                    print(f"[STT] transcript sent: {message['id']}", flush=True)
                else:
                    print("[STT] no speech recognized", flush=True)
            except Exception as exc:
                print(f"[STT] transcription failed: {exc}", flush=True)
            self._status("listening")
