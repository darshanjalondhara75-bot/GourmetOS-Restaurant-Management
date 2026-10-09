import asyncio
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from services.realtime import subscribe, unsubscribe
from utils.security import require_current_user

router = APIRouter(prefix="/api/v1/realtime", tags=["Real-time updates"])


@router.get("/events")
async def realtime_events(
    request: Request,
    current_user: dict = Depends(require_current_user),
):
    async def stream():
        queue = subscribe()
        try:
            yield "retry: 2000\n\n"
            while not await request.is_disconnected():
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=20)
                    yield f"event: activity\ndata: {message}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            unsubscribe(queue)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )
