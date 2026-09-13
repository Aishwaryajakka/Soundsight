"""Live PCM capture, metering, device discovery, and WAV recording."""

from __future__ import annotations

import queue
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np
import sounddevice as sd
import soundfile as sf

from config import AudioConfig


class AudioCaptureError(RuntimeError):
    """Raised when microphone capture cannot be configured or started."""


@dataclass(frozen=True)
class AudioMetrics:
    left_rms: float
    right_rms: Optional[float]
    combined_rms: float
    peak: float


def list_input_devices() -> list[dict[str, object]]:
    try:
        devices = sd.query_devices()
    except sd.PortAudioError as exc:
        raise AudioCaptureError(f"Unable to query audio devices: {exc}") from exc

    inputs: list[dict[str, object]] = []
    for index, device in enumerate(devices):
        channels = int(device["max_input_channels"])
        if channels > 0:
            inputs.append(
                {
                    "index": index,
                    "name": str(device["name"]),
                    "input_channels": channels,
                    "default_sample_rate": int(round(float(device["default_samplerate"]))),
                }
            )
    return inputs


def print_input_devices() -> list[dict[str, object]]:
    devices = list_input_devices()
    if not devices:
        print("No audio input devices were detected.")
        return devices

    print(f"{'Index':>5}  {'Inputs':>6}  {'Sample rate':>11}  Device")
    print(f"{'-----':>5}  {'------':>6}  {'-----------':>11}  ------")
    for device in devices:
        stereo = " (stereo available)" if int(device["input_channels"]) >= 2 else ""
        print(
            f"{int(device['index']):>5}  {int(device['input_channels']):>6}  "
            f"{int(device['default_sample_rate']):>8} Hz  {device['name']}{stereo}"
        )
    return devices


def _device_info(config: AudioConfig) -> dict[str, object]:
    try:
        device = sd.query_devices(config.device, "input")
    except (sd.PortAudioError, ValueError) as exc:
        selected = "default input" if config.device is None else f"device {config.device}"
        raise AudioCaptureError(f"Invalid or unavailable {selected}: {exc}") from exc

    available = int(device["max_input_channels"])
    if available < 1:
        raise AudioCaptureError(f"Selected device '{device['name']}' has no input channels.")
    if config.channels > available:
        raise AudioCaptureError(
            f"Stereo was requested, but '{device['name']}' provides only "
            f"{available} input channel(s). Re-run with --channels {available}."
        )
    try:
        sd.check_input_settings(
            device=config.device,
            channels=config.channels,
            samplerate=config.sample_rate,
            dtype="float32",
        )
    except sd.PortAudioError as exc:
        raise AudioCaptureError(
            f"'{device['name']}' does not support {config.sample_rate} Hz with "
            f"{config.channels} channel(s): {exc}. Its reported default is "
            f"{int(round(float(device['default_samplerate'])))} Hz."
        ) from exc
    return dict(device)


def calculate_metrics(samples: np.ndarray) -> AudioMetrics:
    if samples.ndim != 2 or samples.shape[1] not in (1, 2) or samples.shape[0] == 0:
        raise ValueError("Expected non-empty audio shaped as frames x 1-or-2 channels.")
    squared = np.square(samples.astype(np.float64, copy=False))
    left_rms = float(np.sqrt(np.mean(squared[:, 0])))
    right_rms = float(np.sqrt(np.mean(squared[:, 1]))) if samples.shape[1] == 2 else None
    return AudioMetrics(
        left_rms=left_rms,
        right_rms=right_rms,
        combined_rms=float(np.sqrt(np.mean(squared))),
        peak=float(np.max(np.abs(samples))),
    )


def _friendly_stream_error(exc: Exception) -> AudioCaptureError:
    message = str(exc)
    if "permission" in message.lower() or "not permitted" in message.lower():
        return AudioCaptureError(
            "Microphone permission was denied. Allow microphone access for Terminal or "
            "your Python host in System Settings, then try again."
        )
    return AudioCaptureError(f"Unable to open the microphone stream: {message}")


class LiveAudioCapture:
    """Capture PCM blocks into a bounded queue without combining channels."""

    def __init__(self, config: AudioConfig, *, queue_size: int = 64) -> None:
        config.validate()
        self.config = config
        self.device_info = _device_info(config)
        self.blocks: queue.Queue[np.ndarray] = queue.Queue(maxsize=queue_size)
        self.status_messages: queue.SimpleQueue[str] = queue.SimpleQueue()
        self.stream: Optional[sd.InputStream] = None

    def _callback(
        self,
        indata: np.ndarray,
        frames: int,
        timing: object,
        status: sd.CallbackFlags,
    ) -> None:
        del frames, timing
        if status:
            self.status_messages.put(str(status))
        block = indata.copy()
        try:
            self.blocks.put_nowait(block)
        except queue.Full:
            try:
                self.blocks.get_nowait()
            except queue.Empty:
                pass
            self.blocks.put_nowait(block)

    def __enter__(self) -> "LiveAudioCapture":
        try:
            self.stream = sd.InputStream(
                device=self.config.device,
                samplerate=self.config.sample_rate,
                blocksize=self.config.block_size,
                channels=self.config.channels,
                dtype="float32",
                callback=self._callback,
            )
            self.stream.start()
        except (sd.PortAudioError, OSError) as exc:
            raise _friendly_stream_error(exc) from exc
        return self

    def __exit__(self, *_: object) -> None:
        if self.stream is not None:
            self.stream.stop()
            self.stream.close()

    def get_block(self, timeout: float = 1.0) -> np.ndarray:
        try:
            return self.blocks.get(timeout=timeout)
        except queue.Empty as exc:
            raise AudioCaptureError(
                "No audio arrived from the microphone. Check its connection and permissions."
            ) from exc


def print_metrics(metrics: AudioMetrics) -> None:
    print("\nAudio:")
    print(f"L RMS:        {metrics.left_rms:.3f}")
    print(f"R RMS:        {metrics.right_rms:.3f}" if metrics.right_rms is not None else "R RMS:        n/a (mono input)")
    print(f"Combined RMS: {metrics.combined_rms:.3f}")
    print(f"Peak:         {metrics.peak:.3f}")


def run_meter(config: AudioConfig) -> None:
    device = _device_info(config)
    print(
        f"Capturing '{device['name']}' at {config.sample_rate} Hz, "
        f"{config.channels} channel(s), {config.block_size} frames/block. Ctrl-C to stop."
    )
    windows: list[np.ndarray] = []
    last_output = time.monotonic()
    with LiveAudioCapture(config) as capture:
        while True:
            windows.append(capture.get_block())
            now = time.monotonic()
            if now - last_output >= config.output_interval:
                print_metrics(calculate_metrics(np.concatenate(windows, axis=0)))
                windows.clear()
                last_output = now
            while not capture.status_messages.empty():
                print(f"Audio stream warning: {capture.status_messages.get()}", file=sys.stderr)


def record_test(config: AudioConfig, seconds: float, output_path: Path) -> Path:
    if seconds <= 0:
        raise ValueError("Recording duration must be greater than zero seconds.")
    target_frames = int(round(seconds * config.sample_rate))
    captured: list[np.ndarray] = []
    frame_count = 0
    device = _device_info(config)
    print(
        f"Recording approximately {seconds:g}s from '{device['name']}' at "
        f"{config.sample_rate} Hz with {config.channels} channel(s)..."
    )
    with LiveAudioCapture(config) as capture:
        while frame_count < target_frames:
            block = capture.get_block()
            captured.append(block)
            frame_count += len(block)

    audio = np.concatenate(captured, axis=0)[:target_frames]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(output_path, audio, config.sample_rate, subtype="PCM_16")
    print_metrics(calculate_metrics(audio))
    print(f"Saved {len(audio) / config.sample_rate:.2f}s WAV: {output_path}")
    return output_path


def visualize(config: AudioConfig) -> None:
    try:
        import matplotlib.pyplot as plt
        from matplotlib.animation import FuncAnimation
    except ImportError as exc:
        raise AudioCaptureError(
            "Visualization requires matplotlib. Install requirements.txt and try again."
        ) from exc

    capture = LiveAudioCapture(config)
    capture.__enter__()
    history_frames = max(config.sample_rate * 2, config.block_size)
    history = np.zeros((history_frames, config.channels), dtype=np.float32)
    figure, axis = plt.subplots()
    x = np.arange(history_frames) / config.sample_rate - 2.0
    names = ("Left", "Right")
    lines = [axis.plot(x, history[:, channel], label=names[channel])[0] for channel in range(config.channels)]
    axis.set(title="SoundSight live microphone", xlabel="Seconds", ylabel="Amplitude", ylim=(-1, 1), xlim=(-2, 0))
    axis.legend(loc="upper right")

    def update(_: int) -> list[object]:
        nonlocal history
        latest: list[np.ndarray] = []
        while True:
            try:
                latest.append(capture.blocks.get_nowait())
            except queue.Empty:
                break
        if latest:
            samples = np.concatenate(latest, axis=0)
            count = min(len(samples), history_frames)
            history = np.roll(history, -count, axis=0)
            history[-count:] = samples[-count:]
            for channel, line in enumerate(lines):
                line.set_ydata(history[:, channel])
        return lines

    animation = FuncAnimation(figure, update, interval=50, blit=True, cache_frame_data=False)
    try:
        plt.show()
    finally:
        del animation
        capture.__exit__()
