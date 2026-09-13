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


if __name__ == "__main__":
    unittest.main()
