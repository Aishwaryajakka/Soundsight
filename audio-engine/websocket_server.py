"""Non-blocking WebSocket broadcast transport for validated SoundEvents."""

from __future__ import annotations

import asyncio
import json
import threading
from dataclasses import dataclass, field
from typing import Optional, Set

import websockets
from websockets.exceptions import ConnectionClosed
from websockets.server import WebSocketServer, WebSocketServerProtocol

from classifier import Detection
from config import AudioConfig
from event_tracker import EventTracker, SoundEvent, validate_sound_event
from localization import center_fallback


@dataclass(eq=False)
class _Client:
    websocket: WebSocketServerProtocol
    queue: asyncio.Queue[str]


class SoundEventWebSocketServer:
    """Broadcast one validated JSON SoundEvent per WebSocket message."""

    def __init__(self, config: AudioConfig, initial_event: Optional[SoundEvent] = None) -> None:
        config.validate()
        if initial_event is not None:
            validate_sound_event(initial_event)
        self.config = config
        self.initial_event = initial_event
        self._clients: Set[_Client] = set()
        self._server: Optional[WebSocketServer] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._client_connected = asyncio.Event()

    @property
    def client_count(self) -> int:
        return len(self._clients)

    @property
    def bound_port(self) -> int:
        if self._server is None or not self._server.sockets:
            return self.config.websocket_port
        return int(self._server.sockets[0].getsockname()[1])

    @property
    def url(self) -> str:
        return f"ws://{self.config.websocket_host}:{self.bound_port}{self.config.websocket_path}"

    async def start(self) -> None:
        if self._server is not None:
            return
        self._loop = asyncio.get_running_loop()
        self._server = await websockets.serve(
            self._handler,
            self.config.websocket_host,
            self.config.websocket_port,
            ping_interval=self.config.websocket_ping_interval_seconds,
            ping_timeout=self.config.websocket_ping_timeout_seconds,
            max_queue=16,
        )

    async def stop(self) -> None:
        # Stop accepting clients first. A peer may disappear between the snapshot
        # below and close(); shutdown must remain best-effort and traceback-free.
        server = self._server
        self._server = None
        if server is not None:
            server.close()
        clients = list(self._clients)
        await asyncio.gather(
            *(
                client.websocket.close(code=1001, reason="SoundSight server shutting down")
                for client in clients
            ),
            return_exceptions=True,
        )
        if server is not None:
            await server.wait_closed()
        self._clients.clear()

    async def _handler(self, websocket: WebSocketServerProtocol, path: str) -> None:
        if path != self.config.websocket_path:
            await websocket.close(code=1008, reason="Expected SoundSight events path")
            return
        client = _Client(
            websocket,
            asyncio.Queue(maxsize=self.config.websocket_client_queue_size),
        )
        self._clients.add(client)
        self._client_connected.set()
        print(f"WebSocket client connected ({self.client_count} total): {websocket.remote_address}")
        if self.initial_event is not None:
            await self._enqueue(client, self._serialize(self.initial_event))
        sender = asyncio.create_task(self._sender(client))
        try:
            await websocket.wait_closed()
        finally:
            sender.cancel()
            await asyncio.gather(sender, return_exceptions=True)
            self._clients.discard(client)
            if not self._clients:
                self._client_connected.clear()
            print(f"WebSocket client disconnected ({self.client_count} total): {websocket.remote_address}")

    async def _sender(self, client: _Client) -> None:
        try:
            while True:
                await client.websocket.send(await client.queue.get())
        except (ConnectionClosed, asyncio.CancelledError):
            return

    @staticmethod
    def _serialize(event: SoundEvent) -> str:
        validate_sound_event(event)
        return json.dumps(event, separators=(",", ":"), allow_nan=False)

    async def _enqueue(self, client: _Client, message: str) -> None:
        if client.queue.full():
            try:
                client.queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        client.queue.put_nowait(message)

    async def broadcast(self, event: SoundEvent) -> int:
        message = self._serialize(event)
        clients = list(self._clients)
        await asyncio.gather(*(self._enqueue(client, message) for client in clients))
        return len(clients)

    def publish_threadsafe(self, event: SoundEvent) -> None:
        """Validate immediately, then schedule broadcast from an inference thread."""
        validate_sound_event(event)
        if self._loop is None or self._server is None:
            raise RuntimeError("WebSocket server is not running.")
        future = asyncio.run_coroutine_threadsafe(self.broadcast(event), self._loop)

        def report_failure(completed) -> None:
            try:
                completed.result()
            except Exception as exc:
                print(f"WebSocket broadcast failed: {exc}")

        future.add_done_callback(report_failure)

    async def wait_for_client(self, timeout: Optional[float] = None) -> None:
        await asyncio.wait_for(self._client_connected.wait(), timeout=timeout)


def build_test_event(config: AudioConfig) -> SoundEvent:
    tracker = EventTracker(config, id_factory=lambda: "event-test-doorbell")
    event = tracker.observe(
        Detection(
            "Doorbell",
            "doorbell",
            "Doorbell",
            0.87,
            0.72,
            config.event_required_supporting_frames,
        ),
        center_fallback("deterministic transport test"),
    )
    if event is None:
        raise RuntimeError("Test event did not satisfy the configured event threshold.")
    return event


async def serve_engine(config: AudioConfig, *, test_event_only: bool = False) -> None:
    """Run transport plus either the real engine worker or deterministic test mode."""
    initial_event = build_test_event(config) if test_event_only else None
    server = SoundEventWebSocketServer(config, initial_event=initial_event)
    await server.start()
    print(f"SoundSight WebSocket server listening at {server.url}")
    if config.websocket_host == "0.0.0.0":
        print(
            f"Local client URL: ws://127.0.0.1:{server.bound_port}{config.websocket_path} "
            "(use this computer's LAN IP from another device)"
        )

    if test_event_only:
        print("Test mode: each client receives one deterministic SoundEvent on connection.")
        try:
            await asyncio.Future()
        finally:
            await server.stop()
        return

    stop_event = threading.Event()

    def engine_worker() -> None:
        # Import here to avoid a main.py import cycle.
        from main import classify_live

        classify_live(
            config,
            on_event=server.publish_threadsafe,
            stop_event=stop_event,
            print_events=True,
        )

    task = asyncio.create_task(asyncio.to_thread(engine_worker))
    try:
        await task
    finally:
        stop_event.set()
        await server.stop()
