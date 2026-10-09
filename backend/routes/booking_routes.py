from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database import (
    tables_collection,
    bookings_collection,
    customer_sessions_collection,
    orders_collection,
)
from models.schemas import TableBookingRequest, TableBookingResponse, StandardAPIResponse
from utils.security import require_current_user
from services.customer_session import start_customer_session, validate_customer_session
from services.order_completion import complete_paid_ready_order

router = APIRouter(prefix="/api/bookings", tags=["Table Booking"])

def _user(user: dict) -> dict:
    if user.get("role") != "user":
        raise HTTPException(status_code=403, detail="Customer/User access is required for table booking.")
    return user

def _booking_response(doc: dict, session: dict | None = None) -> TableBookingResponse:
    return TableBookingResponse(
        id=doc.get("id", str(doc.get("_id"))),
        table_number=str(doc.get("table_number")),
        capacity=int(doc.get("capacity", 4)),
        customer_name=doc.get("customer_name", ""),
        status=doc.get("status", "Active"),
        booked_at=doc.get("booked_at", ""),
        released_at=doc.get("released_at"),
        session_token=(
            (session or {}).get("raw_token") or (session or {}).get("token")
            if (session or {}).get("status", "active") == "active"
            else None
        ),
        order_token=(session or {}).get("display_token") or (session or {}).get("order_token"),
        order_placed=bool((session or {}).get("order_id")),
    )

@router.get("/mine", response_model=List[TableBookingResponse])
async def my_bookings(current_user: dict = Depends(require_current_user)):
    user = _user(current_user)
    bookings = []
    cursor = bookings_collection.find({"user_id": user.get("sub")}).sort("booked_at", -1)
    async for doc in cursor:
        session = None
        if doc.get("status") == "Active":
            session = await customer_sessions_collection.find_one(
                {
                    "booking_id": doc.get("id"),
                    "user_id": user.get("sub"),
                    "status": {"$in": ["active", "used"]},
                }
            )
            if session and session.get("order_id"):
                order_ref = session["order_id"]
                order = await orders_collection.find_one({
                    "$or": [{"order_id": order_ref}, {"id": order_ref}],
                })
                if order:
                    reconciled = await complete_paid_ready_order(order)
                    if reconciled.get("status") == "Completed" and reconciled.get("payment_status") == "Paid":
                        doc["status"] = "Completed"
                        doc["released_at"] = reconciled.get("completed_at") or datetime.now(timezone.utc).isoformat()
                        session = None
        bookings.append(_booking_response(doc, session))
    return bookings

@router.post("", response_model=TableBookingResponse)
async def create_booking(payload: TableBookingRequest, current_user: dict = Depends(require_current_user)):
    user = _user(current_user)
    customer_name = payload.customer_name.strip()
    table_number = str(payload.table_number).strip()
    if len(customer_name) < 2:
        raise HTTPException(status_code=400, detail="Name is required before booking a table.")
    table = await tables_collection.find_one({"table_number": table_number})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found.")
    if table.get("status", "Available") != "Available":
        raise HTTPException(status_code=409, detail=f"Table #{table_number} is not available right now.")
    existing = await bookings_collection.find_one({"user_id": user.get("sub"), "status": "Active"})
    if existing:
        raise HTTPException(status_code=409, detail=f"You already have Table #{existing.get('table_number')} booked. Finish that session before booking another table.")

    now = datetime.now(timezone.utc).isoformat()
    booking_id = f"booking_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "id": booking_id,
        "user_id": user.get("sub"),
        "customer_name": customer_name,
        "table_number": table_number,
        "capacity": int(table.get("capacity", 4)),
        "status": "Active",
        "booked_at": now,
    }
    try:
        await bookings_collection.insert_one(doc)
        update = await tables_collection.update_one(
            {"table_number": table_number, "status": "Available"},
            {"$set": {
                "status": "Reserved",
                "reserved_by_name": customer_name,
                "reserved_by_user_id": user.get("sub"),
                "reservation_id": booking_id,
                "reserved_at": now,
            }},
        )
        if update.matched_count == 0:
            await bookings_collection.delete_one({"id": booking_id})
            raise HTTPException(status_code=409, detail="Table was just booked by another customer. Please choose another table.")
    except HTTPException:
        raise
    except Exception:
        await bookings_collection.delete_one({"id": booking_id})
        raise HTTPException(status_code=500, detail="Could not create the table booking.")
    session = await start_customer_session(
        user_id=user.get("sub"),
        customer_name=customer_name,
        table_number=table_number,
        booking_id=booking_id,
    )
    return _booking_response(doc, session)

@router.post("/{booking_id}/menu-session")
async def start_menu_session(booking_id: str, current_user: dict = Depends(require_current_user)):
    user = _user(current_user)
    booking = await bookings_collection.find_one({"id": booking_id, "user_id": user.get("sub")})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("status") != "Active":
        raise HTTPException(status_code=409, detail="This table booking is no longer active.")
    session = await start_customer_session(
        user_id=user.get("sub"),
        customer_name=booking.get("customer_name", user.get("name", "Customer")),
        table_number=str(booking.get("table_number")),
        booking_id=booking.get("id"),
    )
    return {**session, "customer_name": booking.get("customer_name", ""), "booking_id": booking.get("id")}

@router.post("/start-session")
async def start_session_from_table(table_number: str, current_user: dict = Depends(require_current_user)):
    user = _user(current_user)
    booking = await bookings_collection.find_one({"user_id": user.get("sub"), "table_number": str(table_number), "status": "Active"})
    if not booking:
        raise HTTPException(status_code=409, detail="You need an active table booking before entering the customer menu.")
    return {**(await start_customer_session(
        user_id=user.get("sub"),
        customer_name=booking.get("customer_name", user.get("name", "Customer")),
        table_number=str(table_number),
        booking_id=booking.get("id"),
    )), "customer_name": booking.get("customer_name", ""), "booking_id": booking.get("id")}

@router.get("/session/validate")
async def validate_session(token: str, table_number: str | None = None, current_user: dict = Depends(require_current_user)):
    user = _user(current_user)
    try:
        doc = await validate_customer_session(token, user_id=user.get("sub"), table_number=table_number)
        return {"active": True, "table_number": doc.get("table_number"), "customer_name": doc.get("customer_name"), "expires_at": doc.get("expires_at")}
    except HTTPException as exc:
        if exc.status_code == 409:
            return {"active": False, "table_number": table_number, "message": exc.detail}
        raise

@router.delete("/{booking_id}", response_model=StandardAPIResponse)
async def cancel_booking(booking_id: str, current_user: dict = Depends(require_current_user)):
    _user(current_user)
    raise HTTPException(
        status_code=400,
        detail="Table reservations cannot be cancelled once booked. Please proceed to your dining session.",
    )
