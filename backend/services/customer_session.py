import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from pymongo import ReturnDocument
from fastapi import HTTPException
from database import customer_sessions_collection

SESSION_DURATION_HOURS = 2
_DISPLAY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

def _now() -> datetime:
    return datetime.now(timezone.utc)

def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def _display_token() -> str:
    return "GOS-" + "".join(secrets.choice(_DISPLAY_ALPHABET) for _ in range(6))

def _session_payload(doc: dict, raw_token: str) -> dict:
    return {
        "token": raw_token,
        "order_token": doc.get("display_token") or _display_token(),
        "table_number": doc.get("table_number"),
        "expires_at": doc.get("expires_at"),
    }

def _is_expired(doc: dict) -> bool:
    try:
        expires_at = datetime.fromisoformat(doc["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return expires_at <= _now()
    except (KeyError, TypeError, ValueError):
        return True

async def start_customer_session(*, user_id: str, customer_name: str, table_number: str, booking_id: str) -> dict:
    used = await customer_sessions_collection.find_one({"booking_id": booking_id, "status": "used"})
    if used:
        raise HTTPException(status_code=409, detail="Dining session ended. Only one order can be placed per session.")

    existing = await customer_sessions_collection.find_one(
        {"booking_id": booking_id, "user_id": user_id, "status": "active"}
    )
    if existing:
        if _is_expired(existing):
            await customer_sessions_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "status": "expired",
                    "ended_at": _now().isoformat(),
                    "end_reason": "Session timeout",
                }, "$unset": {"raw_token": ""}},
            )
            raise HTTPException(status_code=409, detail="Dining session expired. Please book a new table to order again.")
        if existing.get("raw_token"):
            return _session_payload(existing, existing["raw_token"])
        recovered = secrets.token_urlsafe(32)
        await customer_sessions_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"raw_token": recovered, "token_hash": hash_session_token(recovered)}},
        )
        existing["raw_token"] = recovered
        return _session_payload(existing, recovered)

    raw_token = secrets.token_urlsafe(32)
    now = _now()
    display_token = _display_token()
    doc = {
        "id": f"dining_{secrets.token_hex(10)}",
        "token_hash": hash_session_token(raw_token),
        "raw_token": raw_token,
        "display_token": display_token,
        "user_id": user_id,
        "customer_name": customer_name,
        "table_number": table_number,
        "booking_id": booking_id,
        "status": "active",
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(hours=SESSION_DURATION_HOURS)).isoformat(),
        "expires_at_dt": now + timedelta(hours=SESSION_DURATION_HOURS),
    }
    await customer_sessions_collection.insert_one(doc)
    return _session_payload(doc, raw_token)

async def validate_customer_session(token: str, *, user_id: str | None = None, table_number: str | None = None) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Dining session token is required.")
    query = {"token_hash": hash_session_token(token)}
    doc = await customer_sessions_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid dining session token.")
    if user_id and doc.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="This dining session belongs to another customer.")
    if table_number and str(doc.get("table_number")) != str(table_number):
        raise HTTPException(status_code=403, detail="Dining session is locked to another table.")
    if doc.get("status") != "active":
        raise HTTPException(status_code=409, detail="Dining session ended. Please book a new table to order again.")
    try:
        expires_at = datetime.fromisoformat(doc["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= _now():
            await customer_sessions_collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {"status": "expired", "ended_at": _now().isoformat(), "end_reason": "Session timeout"}},
            )
            raise HTTPException(status_code=409, detail="Dining session expired. Please book a new table to order again.")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid dining session expiry.")
    return doc

async def consume_customer_session(token: str, *, user_id: str, table_number: str, order_id: str) -> dict:
    now = _now().isoformat()
    query = {
        "token_hash": hash_session_token(token),
        "user_id": user_id,
        "table_number": table_number,
        "status": "active",
    }
    result = await customer_sessions_collection.find_one_and_update(
        query,
        {
            "$set": {
                "status": "used",
                "used_at": now,
                "order_id": order_id,
                "ended_at": now,
                "end_reason": "Order placed",
            },
            "$unset": {"raw_token": ""},
        },
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=409, detail="Dining session ended. Only one order can be placed per session.")
    return result
