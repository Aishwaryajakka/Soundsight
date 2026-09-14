"""Transcript protocol validation without loading the speech model."""
import sys
import threading
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from transcription import LocalTranscriber, validate_transcript_segment

class _Segment:
    text = " Hello SoundSight "

class _Model:
    def transcribe(self, audio, **kwargs):
        return iter([_Segment()]), object()

class TranscriptTests(unittest.TestCase):
    def test_valid_final_segment(self) -> None:
        validate_transcript_segment({"id": "transcript-1", "text": "Hello", "timestamp": 1_789_284_184_450, "isFinal": True})

    def test_malformed_segments_are_rejected(self) -> None:
        valid = {"id": "transcript-1", "text": "Hello", "timestamp": 1_789_284_184_450, "isFinal": True}
        for key in valid:
            malformed = dict(valid); malformed.pop(key)
            with self.assertRaises(ValueError): validate_transcript_segment(malformed)
        for change in ({"id": ""}, {"text": "  "}, {"timestamp": "now"}, {"isFinal": 1}):
            with self.assertRaises(ValueError): validate_transcript_segment({**valid, **change})

    def test_buffered_pcm_reaches_transcriber_and_emits_final_segment(self) -> None:
        received = []
        ready = threading.Event()
        transcriber = LocalTranscriber(window_seconds=1.0, model_factory=_Model)
        transcriber.start(lambda segment: (received.append(segment), ready.set()), lambda _status: None)
        transcriber.configure(True)
        transcriber.submit(np.full((8_000, 1), 0.05, dtype=np.float32), 16_000)
        self.assertFalse(ready.wait(0.05))
        transcriber.submit(np.full((8_000, 1), 0.05, dtype=np.float32), 16_000)
        self.assertTrue(ready.wait(1.0))
        transcriber.stop()
        self.assertEqual(received[0]["text"], "Hello SoundSight")

    def test_empty_stt_result_does_not_emit_transcript(self) -> None:
        class EmptyModel:
            def transcribe(self, audio, **kwargs): return iter(()), object()
        received = []
        transcriber = LocalTranscriber(window_seconds=1.0, model_factory=EmptyModel)
        transcriber.start(received.append, lambda _status: None)
        transcriber.configure(True)
        transcriber.submit(np.zeros((16_000, 1), dtype=np.float32), 16_000)
        threading.Event().wait(0.15)
        transcriber.stop()
        self.assertEqual(received, [])

if __name__ == "__main__": unittest.main()
