import asyncio
import json
from typing import Set


_subscribers: Set[asyncio.Queue[str]] = set()
_sequence = 0


def subscribe() -> asyncio.Queue[str]:
    queue: asyncio.Queue[str] = asyncio.Queue(maxsize=32)
    _subscribers.add(queue)
    return queue


def unsubscribe(queue: asyncio.Queue[str]) -> None:
    _subscribers.discard(queue)


async def publish_activity(resource: str) -> None:
    global _sequence
    _sequence += 1
    message = json.dumps({"id": _sequence, "resource": resource})
    for queue in tuple(_subscribers):
        queued_message = message
        if queue.full():
            try:
                while True:
                    queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
            queued_message = json.dumps({"id": _sequence, "resource": "all"})
        queue.put_nowait(queued_message)
