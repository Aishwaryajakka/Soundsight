import unittest
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from audio_sources import WebSocketAudioSource


class WebSocketAudioSourceTests(unittest.TestCase):
    def test_config_pcm_conversion_and_disconnect_cleanup(self):
        source = WebSocketAudioSource()
        source.configure(1, 16000, 1, "pcm_s16le")
        self.assertEqual(source.push(1, np.array([-32768, 0, 32767], dtype="<i2").tobytes()), 3)
        np.testing.assert_allclose(source.read()[:, 0], [-1.0, 0.0, 32767 / 32768])
        source.push(1, b"\x00\x00")
        source.disconnect(1)
        self.assertTrue(source._queue.empty())

    def test_rejects_bad_config_and_unconfigured_frames(self):
        source = WebSocketAudioSource()
        with self.assertRaises(ValueError): source.configure(1, 48000, 1, "pcm_s16le")
        with self.assertRaises(ValueError): source.push(1, b"\x00\x00")
        source.configure(1, 16000, 1, "pcm_s16le")
        with self.assertRaises(ValueError): source.push(1, b"\x00")
