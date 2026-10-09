from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from services.realtime import publish_activity


class RealtimeActivityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        if (
            path.startswith("/api/")
            and not path.startswith("/api/auth/")
            and request.method in {"POST", "PUT", "PATCH", "DELETE"}
            and response.status_code < 400
        ):
            if path.startswith("/api/orders") or path.endswith("/checkout"):
                resource = "orders"
            elif path.startswith("/api/cart"):
                resource = "carts"
            elif path.startswith("/api/bookings"):
                resource = "bookings"
            elif path.startswith("/api/tables"):
                resource = "tables"
            elif path.startswith("/api/menu"):
                resource = "menu"
            elif path.startswith("/api/inventory"):
                resource = "inventory"
            elif path.startswith("/api/shifts"):
                resource = "shifts"
            elif path.startswith("/api/users"):
                resource = "users"
            elif path.startswith("/api/notifications"):
                resource = "notifications"
            elif path.startswith("/api/plans"):
                resource = "plans"
            else:
                resource = "all"
            await publish_activity(resource)
        return response
