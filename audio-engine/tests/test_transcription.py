"""Transcript protocol validation without loading the speech model."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from transcription import validate_transcript_segment

class TranscriptTests(unittest.TestCase):
    def test_valid_final_segment(self) -> None:
        validate_transcript_segment({"type": "transcript", "id": "transcript-1", "text": "Hello", "timestamp": 1_789_284_184_450, "isFinal": True})

    def test_malformed_segments_are_rejected(self) -> None:
        valid = {"type": "transcript", "id": "transcript-1", "text": "Hello", "timestamp": 1_789_284_184_450, "isFinal": True}
        for key in valid:
            malformed = dict(valid); malformed.pop(key)
            with self.assertRaises(ValueError): validate_transcript_segment(malformed)
        for change in ({"id": ""}, {"text": "  "}, {"timestamp": "now"}, {"isFinal": 1}):
            with self.assertRaises(ValueError): validate_transcript_segment({**valid, **change})

if __name__ == "__main__": unittest.main()
