from typing import Optional
from fastapi import APIRouter, Depends, Body
from models.schemas import (
    DirectLoginRequest, RegisterRequest, LoginResponse, UserResponse,
    RefreshTokenRequest, RefreshTokenResponse, LogoutRequest
)
from services.auth_service import (
    process_direct_login, process_user_registration, fetch_user_profile,
    process_token_refresh, process_logout
)
from utils.security import get_current_user, require_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=LoginResponse)
async def user_register(payload: RegisterRequest):
    """
    Register a new user account.
    Returns:
    - access_token & refresh_token
    - user profile information
    """
    result = await process_user_registration(
        name=payload.name,
        email=payload.email,
        raw_password=payload.password,
        role=payload.role or "user"
    )
    return LoginResponse(**result)


@router.post("/login", response_model=LoginResponse)
async def user_login(payload: DirectLoginRequest):
    """
    Login with email & password.
    Returns:
    - access_token  (expires in 60 seconds)
    - refresh_token (expires in 1 year, stored in MongoDB for tracking)
    """
    result = await process_direct_login(
        email=payload.email,
        raw_password=payload.password,
        requested_role=payload.requested_role or "admin"
    )
    return LoginResponse(**result)



@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token_endpoint(payload: RefreshTokenRequest):
    """
    Refresh Token Rotation Endpoint:
    - Validates the 1-year refresh token via MongoDB lookup.
    - OLD token is immediately revoked after use (rotation).
    - Issues a NEW access_token (60s) + NEW refresh_token (1yr).
    - If a revoked/stolen token is replayed → ALL user sessions are revoked (breach detection).
    """
    result = await process_token_refresh(payload.refresh_token)
    return RefreshTokenResponse(**result)


@router.post("/logout")
async def user_logout(
    payload: Optional[LogoutRequest] = Body(default=None),
    current_user: dict = Depends(require_current_user)
):
    """
    Secure Logout:
    - Strictly requires a valid Bearer Access Token in the Authorization header.
    - Revokes the provided refresh_token in MongoDB.
    - User must login again to receive a new refresh_token.
    """
    email = current_user.get("email", payload.email if payload else "")
    refresh_token = payload.refresh_token if payload else None
    await process_logout(refresh_token, email)
    return {"message": "Logged out successfully. Please login again for a new session."}


@router.get("/me", response_model=UserResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Returns current user profile with live MongoDB role."""
    email = current_user.get("email", "")
    profile_data = await fetch_user_profile(email)
    return UserResponse(**profile_data)


# Legacy /api/admin alias
admin_router = APIRouter(prefix="/api/admin", tags=["Legacy Admin Auth"])


@admin_router.post("/login", response_model=LoginResponse)
async def admin_login_legacy(payload: DirectLoginRequest):
    result = await process_direct_login(
        email=payload.email,
        raw_password=payload.password,
        requested_role="admin"
    )
    return LoginResponse(**result)


@admin_router.post("/refresh", response_model=RefreshTokenResponse)
async def admin_refresh_legacy(payload: RefreshTokenRequest):
    result = await process_token_refresh(payload.refresh_token)
    return RefreshTokenResponse(**result)


@admin_router.post("/logout")
async def admin_logout_legacy(
    payload: Optional[LogoutRequest] = Body(default=None),
    current_user: dict = Depends(require_current_user)
):
    email = current_user.get("email", payload.email if payload else "")
    refresh_token = payload.refresh_token if payload else None
    await process_logout(refresh_token, email)
    return {"message": "Logged out successfully. Please login again for a new session."}


@admin_router.get("/me", response_model=UserResponse)
async def get_admin_profile_legacy(current_user: dict = Depends(get_current_user)):
    email = current_user.get("email", "")
    profile_data = await fetch_user_profile(email)
    return UserResponse(**profile_data)

