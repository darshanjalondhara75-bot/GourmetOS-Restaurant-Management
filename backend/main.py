from contextlib import asynccontextmanager
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import APP_TITLE, APP_VERSION, CORS_ORIGINS
from database import init_db
from database_seed import seed_initial_data
from middlewares.error_handler import register_error_handlers
from middlewares.logger_middleware import RequestLoggerMiddleware
from middlewares.realtime_middleware import RealtimeActivityMiddleware

# Import Routers
from routes.auth_routes import router as auth_router, admin_router as legacy_admin_router
from routes.user_routes import router as user_router, customer_router
from routes.table_routes import router as table_router
from routes.shift_routes import router as shift_router
from routes.menu_routes import router as menu_router
from routes.order_routes import router as order_router
from routes.cart_routes import router as cart_router
from routes.notification_routes import router as notification_router
from routes.report_routes import router as report_router
from routes.kitchen_routes import router as kitchen_router
from routes.booking_routes import router as booking_router
from routes.plan_routes import router as plan_router
from routes.inventory_routes import router as inventory_router
from routes.realtime_routes import router as realtime_router

SERVER_SESSION_ID = uuid.uuid4().hex

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize MongoDB indexes & seed sample data
    await init_db()
    await seed_initial_data()
    yield

# Create FastAPI instance
app = FastAPI(
    title=APP_TITLE,
    description="Full-Stack Restaurant Ordering & Management Backend powered by Python FastAPI & MongoDB",
    version=APP_VERSION,
    lifespan=lifespan
)

# 1. Register Request Logging Middleware
app.add_middleware(RequestLoggerMiddleware)
app.add_middleware(RealtimeActivityMiddleware)

# 2. Register CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Register Global Error Handlers
register_error_handlers(app)

# 4. Register API Routers
app.include_router(auth_router)
app.include_router(legacy_admin_router)
app.include_router(user_router)
app.include_router(customer_router)
app.include_router(table_router)
app.include_router(shift_router)
app.include_router(menu_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(notification_router)
app.include_router(report_router)
app.include_router(kitchen_router)
app.include_router(booking_router)
app.include_router(plan_router)
app.include_router(inventory_router)
app.include_router(realtime_router)

@app.get(
    "/v1/models",
    tags=["Models"],
    description="OpenAI-compatible model discovery. No model provider is currently configured.",
)
async def list_models():
    return {"object": "list", "data": []}

# Root Health Check Endpoint
@app.get("/", tags=["Health Check"])
async def read_root():
    return {
        "status": "online",
        "system": APP_TITLE,
        "version": APP_VERSION,
        "session_id": SERVER_SESSION_ID,
        "docs": "Visit http://localhost:8000/docs for full Swagger API documentation"
    }

@app.get("/health", tags=["Health Check"])
async def health_check():
    return {
        "status": "online",
        "system": APP_TITLE,
        "version": APP_VERSION,
    }
