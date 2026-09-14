"""Loopback integration tests for the Phase 5 SoundEvent transport."""

from __future__ import annotations

import asyncio
import json
import sys
import unittest
from pathlib import Path

import websockets
from websockets.exceptions import ConnectionClosedError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import AudioConfig
from event_tracker import REQUIRED_FIELDS
from websocket_server import SoundEventWebSocketServer, build_test_event
from audio_sources import WebSocketAudioSource


class WebSocketServerTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.config = AudioConfig(
            websocket_host="127.0.0.1",
            websocket_port=0,
            websocket_path="/events",
            websocket_ping_interval_seconds=1.0,
            websocket_ping_timeout_seconds=1.0,
        )
        self.event = build_test_event(self.config)
        self.server = SoundEventWebSocketServer(self.config, initial_event=self.event)
        await self.server.start()
        self.url = f"ws://127.0.0.1:{self.server.bound_port}/events"

    async def asyncTearDown(self) -> None:
        await self.server.stop()

    async def wait_for_clients(self, expected: int) -> None:
        for _ in range(50):
            if self.server.client_count == expected:
                return
            await asyncio.sleep(0.01)
        self.fail(f"Expected {expected} clients; found {self.server.client_count}")

    async def test_valid_json_disconnect_and_reconnect(self) -> None:
        async with websockets.connect(self.url) as client:
            payload = json.loads(await asyncio.wait_for(client.recv(), timeout=1.0))
            self.assertTrue(REQUIRED_FIELDS.issubset(payload))
            self.assertEqual(payload["id"], "event-test-doorbell")
        await self.wait_for_clients(0)

        async with websockets.connect(self.url) as reconnected:
            payload = json.loads(await asyncio.wait_for(reconnected.recv(), timeout=1.0))
            self.assertEqual(payload, self.event)

    async def test_multiple_clients_receive_broadcast(self) -> None:
        async with websockets.connect(self.url) as first, websockets.connect(self.url) as second:
            await first.recv()  # initial test messages
            await second.recv()
            self.assertEqual(await self.server.broadcast(self.event), 2)
            first_payload, second_payload = await asyncio.gather(first.recv(), second.recv())
            self.assertEqual(json.loads(first_payload), self.event)
            self.assertEqual(json.loads(second_payload), self.event)

    async def test_transcript_uses_separate_message_schema(self) -> None:
        async with websockets.connect(self.url) as client:
            await client.recv()
            segment = {"id": "transcript-test", "text": "Hello there", "timestamp": 1789284184450, "isFinal": True}
            self.server.publish_transcript_threadsafe(segment)
            self.assertEqual(json.loads(await asyncio.wait_for(client.recv(), timeout=1.0)), {"type": "transcript", "segment": segment})

    async def test_malformed_event_is_rejected(self) -> None:
        malformed = dict(self.event)
        malformed.pop("id")
        with self.assertRaisesRegex(ValueError, "missing required fields"):
            await self.server.broadcast(malformed)  # type: ignore[arg-type]

    async def test_wrong_path_is_closed(self) -> None:
        wrong_url = f"ws://127.0.0.1:{self.server.bound_port}/wrong"
        async with websockets.connect(wrong_url) as client:
            with self.assertRaises(ConnectionClosedError) as raised:
                await client.recv()
            self.assertEqual(raised.exception.code, 1008)

    async def test_valid_threshold_control_and_acknowledgment(self) -> None:
        async with websockets.connect(self.url) as client:
            await client.recv()  # initial event
            await client.send(json.dumps({"type": "config", "minConfidence": 0.25}))
            response = json.loads(await client.recv())
            self.assertEqual(response, {"type": "config_ack", "minConfidence": 0.25})
            self.assertEqual(self.server.confidence_threshold.get(), 0.25)

    async def test_malformed_and_out_of_range_controls_are_rejected(self) -> None:
        async with websockets.connect(self.url) as client:
            await client.recv()  # initial event
            for message in (
                "not-json",
                json.dumps({"type": "config", "minConfidence": 2}),
                json.dumps({"type": "config", "minConfidence": 0.4}),
                json.dumps({"type": "config", "minConfidence": 0.35, "extra": True}),
            ):
                await client.send(message)
                response = json.loads(await client.recv())
                self.assertEqual(response, {"type": "config_error", "code": "invalid_config"})
            self.assertEqual(self.server.confidence_threshold.get(), self.config.min_confidence)

    async def test_audio_config_binary_frame_and_disconnect_cleanup(self) -> None:
        await self.server.stop()
        source = WebSocketAudioSource()
        self.server = SoundEventWebSocketServer(self.config, audio_source=source)
        await self.server.start()
        self.url = f"ws://127.0.0.1:{self.server.bound_port}/events"
        async with websockets.connect(self.url) as client:
            await client.send(json.dumps({"type":"audio_config","format":"pcm_s16le","sampleRate":16000,"channels":1}))
            self.assertEqual(json.loads(await client.recv())["type"], "audio_config_ack")
            await client.send(b"\x00\x00\xff\x7f")
            await asyncio.sleep(0.01)
            self.assertEqual(source.received_samples, 2)
        await self.wait_for_clients(0)
        self.assertTrue(source._queue.empty())


if __name__ == "__main__":
    unittest.main()
