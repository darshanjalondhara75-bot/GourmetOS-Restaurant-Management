from datetime import datetime, timezone, timedelta
from database import users_collection, logs_collection, refresh_tokens_collection
from utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_refresh_token_raw
from config import REFRESH_TOKEN_EXPIRE_DAYS
from fastapi import HTTPException, status



async def _store_refresh_token(jti: str, user_id: str, email: str, role: str):
    """Persist a new refresh token record in MongoDB."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    await refresh_tokens_collection.insert_one({
        "jti": jti,
        "user_id": user_id,
        "email": email,
        "role": role,
        "is_revoked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat()
    })


async def _revoke_token_by_jti(jti: str):
    """Mark a single refresh token as revoked."""
    await refresh_tokens_collection.update_one(
        {"jti": jti},
        {"$set": {"is_revoked": True, "revoked_at": datetime.now(timezone.utc).isoformat()}}
    )


async def _revoke_all_user_tokens(email: str):
    """
    Security breach response: revoke ALL refresh tokens for a user.
    Forces re-login on all devices.
    """
    db = refresh_tokens_collection._coll
    await db.update_many(
        {"email": email, "is_revoked": False},
        {"$set": {"is_revoked": True, "revoked_at": datetime.now(timezone.utc).isoformat(), "revoke_reason": "BREACH_DETECTED"}}
    )
    print(f"[SECURITY] ALL refresh tokens revoked for {email} — possible token theft detected!")


async def process_direct_login(email: str, raw_password: str, requested_role: str = "admin") -> dict:
    """
    Logs user in with email & password verification:
    - Verifies email and hashed password against MongoDB.
    - Raises 401 Unauthorized if email is not found or password is incorrect.
    - Issues access_token and refresh_token upon successful verification.
    """
    clean_email = email.strip().lower()
    if not clean_email or not raw_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide both email address and password."
        )

    existing_user = await users_collection.find_one({"email": clean_email})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="wrong email or password please try again"
        )

    stored_hash = existing_user.get("password_hash")
    if not stored_hash or not verify_password(raw_password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="wrong email or password please try again"
        )

    user_id = existing_user.get("id", str(existing_user.get("_id")))
    assigned_role = existing_user.get("role", requested_role.lower())
    assigned_name = existing_user.get("name", clean_email.split("@")[0].capitalize())

    await logs_collection.insert_one({
        "user_id": user_id,
        "email": clean_email,
        "role": assigned_role,
        "event": "login_success",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    token_data = {"sub": user_id, "email": clean_email, "name": assigned_name, "role": assigned_role}

    access_token = create_access_token(data=token_data)
    refresh_token, jti = create_refresh_token(data=token_data)

    # Persist refresh token in MongoDB for rotation tracking
    try:
        await _store_refresh_token(jti, user_id, clean_email, assigned_role)
    except Exception as err:
        print(f"[WARN] Could not store refresh token in DB: {err}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {"id": user_id, "email": clean_email, "name": assigned_name, "role": assigned_role}
    }



async def process_token_refresh(refresh_token_str: str) -> dict:
    """
    1-Year Refresh Token Endpoint:
    - Validates the 1-year refresh token (expires in 365 days).
    - Checks MongoDB to ensure token has not been revoked via logout.
    - Issues a NEW access_token (60s) while preserving the valid 1-year refresh_token.
    """
    # Step 1: Decode JWT (raises 401 if expired or invalid)
    payload = decode_refresh_token_raw(refresh_token_str)
    jti = payload.get("jti")
    email = payload.get("email", "")
    user_id = payload.get("sub", "usr_default")
    
    if not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed refresh token. Please log in again."
        )

    # Step 2: Look up token in MongoDB for revocation status (logout check)
    try:
        token_record = await refresh_tokens_collection.find_one({"jti": jti})
        if token_record and token_record.get("is_revoked"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked (logged out). Please log in again."
            )
        elif not token_record:
            # Register active 1-year refresh token if not already in DB
            role = payload.get("role", "admin")
            await _store_refresh_token(jti, user_id, email, role)
    except HTTPException:
        raise
    except Exception as err:
        print(f"[WARN] DB check skipped for refresh token: {err}")

    # Fetch latest user profile from MongoDB
    profile = await fetch_user_profile(email)
    assigned_role = profile.get("role", payload.get("role", "admin"))
    assigned_name = profile.get("name", payload.get("name", "User"))

    token_data = {
        "sub": user_id,
        "email": email,
        "name": assigned_name,
        "role": assigned_role
    }

    # Issue fresh 60-second access_token
    new_access_token = create_access_token(data=token_data)

    return {
        "access_token": new_access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer"
    }


async def process_logout(refresh_token_str: str | None, email: str) -> None:
    """
    Logout: Revoke the user's current refresh token in MongoDB.
    Next login will generate a completely new refresh token.
    """
    if refresh_token_str:
        try:
            payload = decode_refresh_token_raw(refresh_token_str)
            jti = payload.get("jti")
            if jti:
                await _revoke_token_by_jti(jti)
                print(f"[OK] Refresh token revoked on logout for {email}")
        except Exception:
            pass  # Token may already be expired — that's fine

    try:
        await logs_collection.insert_one({
            "email": email,
            "event": "logout",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as err:
        print(f"[WARN] Logout log error: {err}")


async def fetch_user_profile(email: str) -> dict:
    """Fetch live user profile from MongoDB."""
    clean_email = email.strip().lower()
    name_prefix = clean_email.split("@")[0].capitalize() if "@" in clean_email else clean_email.capitalize()

    try:
        db_user = await users_collection.find_one({"email": clean_email})
        if db_user:
            return {
                "id": db_user.get("id", str(db_user.get("_id"))),
                "email": db_user.get("email", clean_email),
                "name": db_user.get("name", name_prefix),
                "role": db_user.get("role", "admin"),
                "created_at": db_user.get("created_at")
            }
    except Exception as err:
        print(f"[WARN] MongoDB profile fetch: {err}")

    return {"id": "usr_default", "email": clean_email, "name": name_prefix, "role": "admin"}


# Legacy compat alias
async def log_user_logout(email: str) -> None:
    await process_logout(None, email)


async def process_user_registration(name: str, email: str, raw_password: str, role: str = "user") -> dict:
    """
    Registers a new user and issues access & refresh tokens.
    """
    clean_email = email.strip().lower()
    clean_name = name.strip()
    
    if not clean_name or not clean_email or not raw_password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")
    
    if len(raw_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    existing_user = await users_collection.find_one({"email": clean_email})
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    assigned_role = role.lower() if role else "cashier"
    if assigned_role not in ["user", "cashier", "chef"]:
        raise HTTPException(
            status_code=400,
            detail="Public registration supports Customer/User, Cashier, and Chef roles. Admin account is unique and protected."
        )

    user_id = f"usr_{int(datetime.now(timezone.utc).timestamp())}"

    hashed_pwd = hash_password(raw_password)

    new_user = {
        "id": user_id,
        "email": clean_email,
        "name": clean_name,
        "role": assigned_role,
        "password_hash": hashed_pwd,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await users_collection.insert_one(new_user)
    print(f"[OK] Registered new user: {clean_email} (Name: {clean_name}, Role: {assigned_role})")

    await logs_collection.insert_one({
        "user_id": user_id,
        "email": clean_email,
        "role": assigned_role,
        "event": "registration_success",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    token_data = {"sub": user_id, "email": clean_email, "name": clean_name, "role": assigned_role}
    access_token = create_access_token(data=token_data)
    refresh_token, jti = create_refresh_token(data=token_data)

    try:
        await _store_refresh_token(jti, user_id, clean_email, assigned_role)
    except Exception as err:
        print(f"[WARN] Could not store refresh token in DB during registration: {err}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {"id": user_id, "email": clean_email, "name": clean_name, "role": assigned_role}
    }
