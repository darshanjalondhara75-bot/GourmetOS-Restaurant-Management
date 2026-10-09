from datetime import datetime, timezone

from database import (
    bookings_collection,
    customer_sessions_collection,
    orders_collection,
    tables_collection,
)


async def complete_paid_ready_order(order: dict) -> dict:
    if order.get("payment_status") != "Paid" or order.get("status") not in {"Ready", "Completed"}:
        return order

    now = datetime.now(timezone.utc).isoformat()
    completed_order = dict(order)
    if order.get("status") == "Ready":
        result = await orders_collection.update_one(
            {"_id": order["_id"], "status": "Ready", "payment_status": "Paid"},
            {"$set": {"status": "Completed", "completed_at": now, "updated_at": now}},
        )
        if result.modified_count != 1:
            latest_order = await orders_collection.find_one({"_id": order["_id"]})
            if not latest_order or latest_order.get("status") != "Completed":
                return latest_order or order
            completed_order = latest_order
        else:
            completed_order.update({"status": "Completed", "completed_at": now, "updated_at": now})

    booking_id = completed_order.get("booking_id")
    if not booking_id and completed_order.get("order_id"):
        session = await customer_sessions_collection.find_one({
            "order_id": completed_order["order_id"],
            "status": {"$in": ["used", "completed"]},
        })
        booking_id = session.get("booking_id") if session else None

    if not booking_id:
        return completed_order

    booking = await bookings_collection.find_one({"id": booking_id, "status": "Active"})
    if not booking:
        return completed_order

    await bookings_collection.update_one(
        {"_id": booking["_id"], "status": "Active"},
        {"$set": {"status": "Completed", "released_at": now}},
    )
    await tables_collection.update_one(
        {"table_number": str(booking.get("table_number")), "reservation_id": booking_id},
        {
            "$set": {"status": "Available"},
            "$unset": {
                "reserved_by_name": "",
                "reserved_by_user_id": "",
                "reservation_id": "",
                "reserved_at": "",
            },
        },
    )
    await customer_sessions_collection.update_many(
        {"booking_id": booking_id, "order_id": completed_order.get("order_id"), "status": "used"},
        {
            "$set": {
                "status": "completed",
                "ended_at": now,
                "end_reason": "Paid order completed",
            },
            "$unset": {"raw_token": ""},
        },
    )
    return completed_order
