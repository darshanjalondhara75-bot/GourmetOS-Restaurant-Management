from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import plans_collection, users_collection
from utils.security import require_current_user

router = APIRouter(prefix="/api/plans", tags=["Membership Plans"])


class PlanSubscribeRequest(BaseModel):
    plan_id: str
    razorpay_payment_id: str = ""


def _user(user: dict) -> dict:
    if user.get("role") != "user":
        raise HTTPException(status_code=403, detail="Customer/User access is required for membership plans.")
    return user


# GourmetOS membership plans — Silver / Gold / Platinum
PLANS: List[dict] = [
    {
        "id": "silver",
        "name": "Silver",
        "tier": "Silver",
        "tagline": "Essential dining for small tables",
        "price_inr": 499,
        "price_usd": 6,
        "period": "month",
        "badge": "Starter",
        "features": [
            "Up to 2 guests per table",
            "Standard table booking",
            "QR contactless menu access",
            "Silver dining experience",
            "Email support",
        ],
    },
    {
        "id": "gold",
        "name": "Gold",
        "tier": "Gold",
        "tagline": "The favourite for regular diners",
        "price_inr": 999,
        "price_usd": 12,
        "period": "month",
        "badge": "Most Popular",
        "features": [
            "Up to 4 guests per table",
            "Priority table booking",
            "QR contactless menu access",
            "Premium dining experience",
            "Complimentary welcome drink",
            "Priority phone support",
        ],
    },
    {
        "id": "platinum",
        "name": "Platinum",
        "tier": "Platinum",
        "tagline": "Luxury dining, reserved for you",
        "price_inr": 2499,
        "price_usd": 30,
        "period": "month",
        "badge": "Luxury",
        "features": [
            "Up to 8 guests per table",
            "Premium window-side tables",
            "Chef's special tasting menu",
            "Complimentary desserts & drinks",
            "Dedicated concierge service",
            "24/7 priority support",
        ],
    },
]


@router.get("")
async def list_plans():
    return {"success": True, "plans": PLANS}


@router.get("/my")
async def my_plan_transactions(current_user: dict = Depends(require_current_user)):
    user = _user(current_user)
    transactions = []
    user_filter = {"$or": [{"user_id": user.get("sub")}, {"customer_email": user.get("email")}]}
    cursor = plans_collection.find(user_filter).sort("created_at", -1)
    async for doc in cursor:
        transactions.append(
            {
                "id": doc.get("id", str(doc.get("_id"))),
                "plan_id": doc.get("plan_id"),
                "plan_name": doc.get("plan_name"),
                "amount_inr": doc.get("amount_inr"),
                "amount_usd": doc.get("amount_usd"),
                "currency": doc.get("currency", "INR"),
                "razorpay_payment_id": doc.get("razorpay_payment_id", ""),
                "status": doc.get("status", "Success"),
                "created_at": doc.get("created_at", ""),
            }
        )
    profile_filter = {"$or": [{"id": user.get("sub")}, {"email": user.get("email")}]}
    profile = await users_collection.find_one(profile_filter) or {}
    current_plan = profile.get("plan_id")
    if not current_plan and transactions:
        for t in transactions:
            if str(t.get("status", "")).lower() == "success":
                current_plan = t.get("plan_id")
                try:
                    await users_collection.update_one(
                        profile_filter,
                        {"$set": {"plan_id": current_plan, "plan_name": t.get("plan_name")}},
                    )
                except Exception:
                    pass
                break

    return {
        "success": True,
        "transactions": transactions,
        "current_plan": current_plan or None,
    }


@router.post("/subscribe")
async def subscribe_to_plan(
    payload: PlanSubscribeRequest,
    current_user: dict = Depends(require_current_user),
):
    user = _user(current_user)
    plan = next((p for p in PLANS if p["id"] == payload.plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found.")

    # Block paying again for the plan that is already active.
    profile_filter = {"$or": [{"id": user.get("sub")}, {"email": user.get("email")}]}
    profile = await users_collection.find_one(profile_filter) or {}
    active_plan = str(profile.get("plan_id") or "").strip().lower()
    if active_plan == str(plan["id"]).strip().lower():
        raise HTTPException(
            status_code=400,
            detail=f"You are already subscribed to the {plan['name']} plan.",
        )

    now = datetime.now(timezone.utc).isoformat()
    txn_id = f"plan_txn_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "id": txn_id,
        "user_id": user.get("sub"),
        "customer_name": user.get("name", ""),
        "customer_email": user.get("email", ""),
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "amount_inr": plan["price_inr"],
        "amount_usd": plan["price_usd"],
        "currency": "INR",
        "razorpay_payment_id": payload.razorpay_payment_id.strip(),
        "status": "Success",
        "created_at": now,
    }
    try:
        await plans_collection.insert_one(doc)
        profile_filter = {"$or": [{"id": user.get("sub")}, {"email": user.get("email")}]}
        await users_collection.update_one(
            profile_filter,
            {"$set": {"plan_id": plan["id"], "plan_name": plan["name"], "plan_updated_at": now}},
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Could not record the plan subscription.")
    return {"success": True, "message": f"Welcome to the {plan['name']} plan.", "transaction": {
        "id": txn_id,
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "amount_inr": plan["price_inr"],
        "amount_usd": plan["price_usd"],
        "currency": "INR",
        "razorpay_payment_id": doc["razorpay_payment_id"],
        "status": "Success",
        "created_at": now,
    }}
