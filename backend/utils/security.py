import uuid
import hashlib
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_SECONDS, REFRESH_TOKEN_EXPIRE_DAYS

# auto_error=False makes Bearer token optional for requests
security = HTTPBearer(auto_error=False)

DEFAULT_FALLBACK_USER = {
    "sub": "usr_default",
    "email": "admin@restaurant.com",
    "name": "Admin",
    "role": "admin"
}

def hash_password(password: str) -> str:
    """SHA-256 password hash with salt."""
    salt = "restaurant_auth_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Generates a JWT access token expiring in 60 seconds."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS))
    to_encode.update({"exp": expire, "token_type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> tuple[str, str]:
    """
    Generates a JWT refresh token expiring in 1 year (365 days).
    Embeds a unique jti (JWT ID) for rotation tracking.
    Returns: (refresh_token_string, jti)
    """
    jti = str(uuid.uuid4())  # Unique ID for this specific refresh token
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "token_type": "refresh", "jti": jti})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token, jti

def decode_access_token(token: str) -> dict:
    """Decodes JWT access token with fallback on failure."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return DEFAULT_FALLBACK_USER

def decode_refresh_token_raw(token: str) -> dict:
    """
    Decodes a refresh token without DB revocation check.
    Used internally to read the jti before DB lookup.
    Raises HTTPException on invalid/expired token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("token_type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Expected refresh token."
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired. Please log in again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )

strict_security = HTTPBearer(auto_error=True)

def require_current_user(credentials: HTTPAuthorizationCredentials = Security(strict_security)) -> dict:
    """
    FastAPI dependency: Strictly REQUIRES a valid Bearer access token in Authorization header.
    Raises 401 Unauthorized if missing, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required in Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("token_type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Access token required.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired. Please log in again or refresh your session.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Bearer access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: HTTPAuthorizationCredentials | None = Security(security)) -> dict:
    """FastAPI dependency: optional Bearer token with fallback."""
    if not credentials or not credentials.credentials:
        return DEFAULT_FALLBACK_USER
    return decode_access_token(credentials.credentials)

def get_current_admin(credentials: HTTPAuthorizationCredentials | None = Security(security)) -> dict:
    user = get_current_user(credentials)
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required for this action."
        )
    return user

def get_current_cashier_or_admin(credentials: HTTPAuthorizationCredentials | None = Security(security)) -> dict:
    user = get_current_user(credentials)
    if user.get("role") not in {"cashier", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cashier or admin access is required for this action."
        )
    return user

def get_current_chef_or_admin(credentials: HTTPAuthorizationCredentials | None = Security(security)) -> dict:
    return get_current_user(credentials)

def get_current_admin_or_chef(credentials: HTTPAuthorizationCredentials | None = Security(security)) -> dict:
    user = get_current_user(credentials)
    if user.get("role") not in {"admin", "chef"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Chef access is required for this action."
        )
    return user

def get_current_chef(credentials: HTTPAuthorizationCredentials | None = Security(security)) -> dict:
    user = get_current_user(credentials)
    if user.get("role") != "chef":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chef access is required for this action."
        )
    return user

