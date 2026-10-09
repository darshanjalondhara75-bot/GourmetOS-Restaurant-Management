import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log incoming requests, status codes, and execution duration.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        
        print(f"[REQ] {request.method} {request.url.path} -> {response.status_code} ({process_time:.2f}ms)")
        return response
