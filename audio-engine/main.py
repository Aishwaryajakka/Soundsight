"""Command-line entry point for SoundSight Phase 1 microphone capture."""

from __future__ import annotations

import argparse
import asyncio
import sys
import threading
import time
from pathlib import Path

import numpy as np
import soundfile as sf

from audio_capture import AudioCaptureError, print_input_devices, record_test, run_meter, visualize
from config import AudioConfig


def _localizer(config: AudioConfig, *, announce: bool = True, actual_channels: int = None):
    from localization import DirectionLocalizer, LocalizationUnavailable, center_fallback

    channel_count = config.channels if actual_channels is None else actual_channels
    if channel_count < 2:
        result = center_fallback("selected input has fewer than two channels")
        if announce:
            print(f"Localization unavailable: {result.reason}. Using CENTER fallback.", file=sys.stderr)
        return None, result
    try:
        return DirectionLocalizer(config), None
    except LocalizationUnavailable as exc:
        result = center_fallback(str(exc))
        if announce:
            print(f"Localization unavailable: {result.reason}. Using CENTER fallback.", file=sys.stderr)
        return None, result


def _classifier_components(config: AudioConfig, threshold=None):
    from classifier import StableDetectionFilter, YamNetClassifier

    print("Loading official YAMNet model from TensorFlow Hub...", flush=True)
    classifier = YamNetClassifier()
    classifier.load()
    print("YAMNet ready.", flush=True)
    return classifier, StableDetectionFilter(config, threshold=threshold)


def classify_file(path: Path, config: AudioConfig) -> None:
    from classifier import classify_window, iter_windows
    from event_tracker import EventTracker, print_new_event

    if not path.is_file():
        raise ValueError(f"WAV file does not exist: {path}")
    try:
        samples, sample_rate = sf.read(path, dtype="float32", always_2d=True)
    except (RuntimeError, OSError) as exc:
        raise ValueError(f"Unable to read WAV file '{path}': {exc}") from exc
    if samples.shape[1] > 2:
        print(f"Warning: using the first two of {samples.shape[1]} file channels.", file=sys.stderr)
        samples = samples[:, :2]
    classifier, detection_filter = _classifier_components(config)
    localizer, fallback = _localizer(config, actual_channels=samples.shape[1])
    tracker = EventTracker(config)
    detections = 0
    file_start_epoch_ms = int(time.time() * 1000)
    for index, window in enumerate(
        iter_windows(samples, sample_rate, config.inference_window_seconds, config.inference_hop_seconds)
    ):
        # File time makes cooldown behavior deterministic and independent of inference speed.
        timestamp = index * config.inference_hop_seconds
        localization = localizer.process(window, sample_rate) if localizer is not None else fallback
        for detection in classify_window(classifier, detection_filter, window, sample_rate, config, timestamp):
            event = tracker.observe(
                detection,
                localization,
                now=timestamp,
                epoch_ms=file_start_epoch_ms + int(round(timestamp * 1000)),
            )
            if event is not None:
                print_new_event(event)
                detections += 1
        tracker.tick(timestamp)
    if detections == 0:
        print(f"No stable target sounds met the {config.min_confidence:.2f} confidence threshold.")


def classify_live(
    config: AudioConfig,
    *,
    on_event=None,
    stop_event: threading.Event = None,
    print_events: bool = True,
    confidence_threshold=None,
    on_audio_chunk=None,
) -> None:
    from audio_capture import LiveAudioCapture
    from classifier import classify_window
    from event_tracker import EventTracker, print_new_event

    classifier, detection_filter = _classifier_components(config, threshold=confidence_threshold)
    localizer, fallback = _localizer(config)
    tracker = EventTracker(config)
    window_frames = int(round(config.inference_window_seconds * config.sample_rate))
    hop_frames = int(round(config.inference_hop_seconds * config.sample_rate))
    buffered = np.empty((0, config.channels), dtype=np.float32)
    print(
        f"Classifying live audio at {config.sample_rate} Hz / {config.channels} channel(s). "
        "Original channels remain separate. Ctrl-C to stop."
    )
    with LiveAudioCapture(config) as capture:
        while stop_event is None or not stop_event.is_set():
            buffered = np.concatenate((buffered, capture.get_block()), axis=0)
            while len(buffered) >= window_frames:
                original_window = buffered[:window_frames]
                if on_audio_chunk is not None:
                    on_audio_chunk(original_window[:hop_frames], config.sample_rate)
                localization = (
                    localizer.process(original_window, config.sample_rate)
                    if localizer is not None
                    else fallback
                )
                for detection in classify_window(
                    classifier, detection_filter, original_window, config.sample_rate, config
                ):
                    event = tracker.observe(detection, localization)
                    if event is not None:
                        if print_events:
                            print_new_event(event)
                        if on_event is not None:
                            on_event(event)
                tracker.tick()
                buffered = buffered[hop_frames:]


def localization_test(config: AudioConfig) -> None:
    from audio_capture import LiveAudioCapture
    from localization import DirectionLocalizer, LocalizationUnavailable

    if config.channels < 2:
        raise LocalizationUnavailable(
            "localization requires two input channels; selected configuration is mono"
        )
    localizer = DirectionLocalizer(config)
    window_frames = int(round(0.10 * config.sample_rate))
    buffered = np.empty((0, 2), dtype=np.float32)
    print(
        "Localization test running. Make a short broadband sound to the LEFT, CENTER, "
        "and RIGHT. Ctrl-C to stop."
    )
    print(
        f"Maximum physical delay: {localizer.maximum_delay_s * 1000:.3f} ms; "
        f"center dead-zone: {config.center_dead_zone_s * 1000:.3f} ms."
    )
    with LiveAudioCapture(config) as capture:
        while True:
            buffered = np.concatenate((buffered, capture.get_block()), axis=0)
            while len(buffered) >= window_frames:
                result = localizer.process(buffered[:window_frames], config.sample_rate)
                buffered = buffered[window_frames:]
                if not result.available:
                    print(f"Localization unavailable: {result.reason}")
                elif result.confidence >= 0.10:
                    print(
                        f"direction: {result.direction}\n"
                        f"tdoa_ms: {result.tdoa_ms:.3f}\n"
                        f"localization_confidence: {result.confidence:.2f}\n"
                    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="SoundSight microphone capture prototype")
    actions = parser.add_mutually_exclusive_group()
    actions.add_argument("--list-devices", action="store_true", help="list available input devices")
    actions.add_argument("--visualize", action="store_true", help="show a live waveform")
    actions.add_argument("--record-test", type=float, metavar="SECONDS", help="record debug/test_capture.wav")
    actions.add_argument("--classify", action="store_true", help="classify live microphone audio with YAMNet")
    actions.add_argument("--file", type=Path, metavar="WAV", help="classify a WAV file with YAMNet")
    actions.add_argument("--localization-test", action="store_true", help="test live stereo GCC-PHAT localization")
    actions.add_argument("--serve", action="store_true", help="run the complete engine and WebSocket server")
    actions.add_argument(
        "--send-test-event",
        action="store_true",
        help="serve one deterministic SoundEvent to each connecting client",
    )
    parser.add_argument("--device", type=int, help="input device index; default uses system input")
    parser.add_argument("--sample-rate", type=int, default=48_000, help="capture rate (default: 48000)")
    parser.add_argument("--block-size", type=int, default=960, help="frames per block (default: 960)")
    parser.add_argument("--channels", type=int, choices=(1, 2), default=2, help="1 mono or 2 stereo")
    parser.add_argument("--output-interval", type=float, default=0.5, help="meter interval in seconds")
    parser.add_argument("--min-confidence", type=float, default=0.35, help="stable detection threshold")
    parser.add_argument("--stable-windows", type=int, default=2, help="consecutive smoothed windows required")
    parser.add_argument("--mic-spacing", type=float, metavar="METERS", help="measured microphone spacing")
    parser.add_argument("--speed-of-sound", type=float, default=343.0, metavar="M_S")
    parser.add_argument("--center-dead-zone-ms", type=float, default=0.08, metavar="MS")
    parser.add_argument("--calibration-offset-ms", type=float, default=0.0, metavar="MS")
    parser.add_argument("--localization-smoothing", type=int, default=5, metavar="WINDOWS")
    parser.add_argument("--swap-channels", action="store_true", help="swap left and right before GCC-PHAT")
    parser.add_argument(
        "--positive-tdoa-direction",
        choices=("left", "right"),
        default="left",
        help="empirically calibrated direction for positive TDOA",
    )
    parser.add_argument("--event-merge-seconds", type=float, default=2.5, metavar="SECONDS")
    parser.add_argument("--event-cooldown-seconds", type=float, default=3.0, metavar="SECONDS")
    parser.add_argument("--host", default="0.0.0.0", help="WebSocket bind host")
    parser.add_argument("--port", type=int, default=8765, help="WebSocket bind port")
    parser.add_argument("--ws-path", default="/events", help="WebSocket path")
    parser.add_argument("--client-queue-size", type=int, default=32, help="events buffered per client")
    parser.add_argument("--transcription-model", default="tiny.en", help="local faster-whisper model")
    parser.add_argument("--transcription-window", type=float, default=3.0, metavar="SECONDS")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        if args.list_devices:
            return 0 if print_input_devices() else 1
        config = AudioConfig(
            device=args.device,
            sample_rate=args.sample_rate,
            block_size=args.block_size,
            channels=args.channels,
            output_interval=args.output_interval,
            min_confidence=args.min_confidence,
            stable_windows=args.stable_windows,
            microphone_spacing_m=args.mic_spacing,
            speed_of_sound_m_s=args.speed_of_sound,
            center_dead_zone_s=args.center_dead_zone_ms / 1000.0,
            calibration_offset_s=args.calibration_offset_ms / 1000.0,
            localization_smoothing_windows=args.localization_smoothing,
            swap_channels=args.swap_channels,
            positive_tdoa_direction=args.positive_tdoa_direction,
            event_merge_duration_seconds=args.event_merge_seconds,
            event_cooldown_seconds=args.event_cooldown_seconds,
            websocket_host=args.host,
            websocket_port=args.port,
            websocket_path=args.ws_path,
            websocket_client_queue_size=args.client_queue_size,
            transcription_model=args.transcription_model,
            transcription_window_seconds=args.transcription_window,
        )
        config.validate()
        if args.record_test is not None:
            record_test(config, args.record_test, Path(__file__).parent / "debug" / "test_capture.wav")
        elif args.visualize:
            visualize(config)
        elif args.classify:
            classify_live(config)
        elif args.file is not None:
            classify_file(args.file, config)
        elif args.localization_test:
            localization_test(config)
        elif args.serve or args.send_test_event:
            from websocket_server import serve_engine

            asyncio.run(serve_engine(config, test_event_only=args.send_test_event))
        else:
            run_meter(config)
    except KeyboardInterrupt:
        print("\nCapture stopped.")
    except (AudioCaptureError, ValueError, RuntimeError) as exc:
        print(f"Audio capture error: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
