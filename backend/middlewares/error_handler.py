from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

def register_error_handlers(app: FastAPI) -> None:
    """
    Registers global exception handlers to return clean, uniform JSON error responses with both detail and message keys.
    """
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        detail_msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "detail": detail_msg,
                "message": detail_msg,
                "data": None
            },
            headers=exc.headers
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "detail": "Input validation error. Please check your request parameters.",
                "message": "Input validation error. Please check your request parameters.",
                "data": exc.errors()
            }
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        err_msg = str(exc) or "An unexpected server error occurred."
        print(f"[ERROR] Global Server Exception on {request.url.path}: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "detail": err_msg,
                "message": err_msg,
                "data": None
            }
        )

