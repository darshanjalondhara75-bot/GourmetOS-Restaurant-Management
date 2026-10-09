import os
import math
from dotenv import load_dotenv

# Load backend environment variables from .env file
load_dotenv()

# Application Settings
APP_TITLE = os.getenv("APP_TITLE", "GourmetOS Restaurant Management API")
APP_VERSION = os.getenv("APP_VERSION", "2.0.0")

# Database Configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "restaurant_db")

# JWT Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_RESTAURANT_KEY_2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_SECONDS = int(os.getenv("ACCESS_TOKEN_EXPIRE_SECONDS", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "365"))

# Razorpay credentials (kept server-side; the key ID is safe to return to checkout clients)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
from decimal import Decimal, ROUND_HALF_UP
USD_TO_INR_RATE = float(os.getenv("USD_TO_INR_RATE", "83.00"))
if not math.isfinite(USD_TO_INR_RATE) or USD_TO_INR_RATE <= 0:
    raise ValueError("USD_TO_INR_RATE must be a finite number greater than zero.")

def usd_to_inr_paise(amount_usd: float) -> int:
    amount_inr = Decimal(str(amount_usd)) * Decimal(str(USD_TO_INR_RATE))
    return int((amount_inr * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

def inr_to_paise(amount_inr: float) -> int:
    return int((Decimal(str(amount_inr)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

def get_razorpay_credentials() -> tuple[str, str]:
    """Dynamically read Razorpay credentials, checking .env if updated."""
    # Re-check .env so key updates take effect immediately
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path, override=True)
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    return key_id, key_secret

# CORS Configuration
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
)
CORS_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
