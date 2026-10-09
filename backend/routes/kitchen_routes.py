"""
Kitchen / Chef Panel APIs
=========================
Routes for the Kitchen Display System (KDS) used by chefs.

Endpoints:
  GET  /api/kitchen/queue                     → Active kitchen order queue
  GET  /api/kitchen/queue/summary             → Live counts by status
  GET  /api/kitchen/order/{order_identifier}  → Single order detail
  PATCH/PUT /api/kitchen/order/{order_identifier}/status  → Update order status
  PATCH /api/kitchen/order/{order_identifier}/item-status → Mark individual item done
  POST /api/kitchen/order/{order_identifier}/accept       → Accept (Pending → Accepted)
  POST /api/kitchen/order/{order_identifier}/start        → Start cooking (→ Cooking)
  POST /api/kitchen/order/{order_identifier}/ready        → Mark food ready (→ Ready)
  POST /api/kitchen/order/{order_identifier}/cancel       → Cancel order
  GET  /api/kitchen/stats                     → Today's kitchen performance stats
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from pydantic import BaseModel

from database import orders_collection, notifications_collection, tables_collection
from models.schemas import OrderResponse, StandardAPIResponse
from utils.security import get_current_user
from services.order_completion import complete_paid_ready_order

router = APIRouter(prefix="/api/kitchen", tags=["Kitchen / Chef Panel"])

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
KITCHEN_ACTIVE_STATUSES = ["Pending", "Accepted", "Cooking", "Preparing"]
KITCHEN_VALID_TRANSITIONS = {
    "Pending":   ["Accepted", "Cancelled"],
    "Accepted":  ["Cooking", "Preparing", "Cancelled"],
    "Preparing": ["Cooking", "Ready", "Cancelled"],
    "Cooking":   ["Ready", "Cancelled"],
    "Ready":     ["Completed", "Cancelled"],
    "Completed": [],
    "Cancelled": [],
}

# ---------------------------------------------------------------------------
# Request schemas (kitchen-specific)
# ---------------------------------------------------------------------------
class KitchenStatusUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = None  # optional chef note / reason

class ItemStatusUpdateRequest(BaseModel):
    item_id: str
    done: bool = True  # True = this item is prepared

# ---------------------------------------------------------------------------
# Helper: build flexible order lookup query
# ---------------------------------------------------------------------------
def _build_order_query(order_identifier: str) -> dict:
    conditions = [
        {"id": order_identifier},
        {"order_id": order_identifier},
        {"_id": order_identifier},
    ]
    clean_id = order_identifier[4:] if order_identifier.startswith("ord_") else order_identifier
    if ObjectId.is_valid(clean_id):
        conditions.append({"_id": ObjectId(clean_id)})
        conditions.append({"id": clean_id})
    if ObjectId.is_valid(order_identifier):
        conditions.append({"_id": ObjectId(order_identifier)})
    return {"$or": conditions}

# ---------------------------------------------------------------------------
# Helper: map Mongo doc → OrderResponse
# ---------------------------------------------------------------------------
def _doc_to_order_response(doc: dict) -> OrderResponse:
    return OrderResponse(
        id=doc.get("id", str(doc.get("_id", ""))),
        order_id=doc.get("order_id", "ORD-000"),
        table_number=doc.get("table_number", "N/A"),
        customer_name=doc.get("customer_name", "Guest"),
        items=doc.get("items", []),
        total_amount=float(doc.get("total_amount", 0.0)),
        status=doc.get("status", "Pending"),
        payment_status=doc.get("payment_status", "Unpaid"),
        special_instructions=doc.get("special_instructions", ""),
        created_at=doc.get("created_at") or "",
    )

# ---------------------------------------------------------------------------
# Helper: fire a kitchen notification
# ---------------------------------------------------------------------------
async def _kitchen_notify(order_id: str, table_number: str, new_status: str, actor: str):
    try:
        now = datetime.now(timezone.utc)
        await notifications_collection.insert_one({
            "id": f"ntf_kds_{int(now.timestamp())}",
            "title": f"Kitchen Update – {order_id}",
            "message": (
                f"Order {order_id} (Table #{table_number}) "
                f"marked as '{new_status}' by {actor}."
            ),
            "type": "kitchen",
            "target_role": "all",
            "created_at": now.isoformat(),
            "is_read": False,
        })
    except Exception as err:
        print(f"[WARN] Kitchen notification error: {err}")


# ===========================================================================
# 1. GET  /api/kitchen/queue  — Active order queue for KDS
# ===========================================================================
@router.get(
    "/queue",
    response_model=List[OrderResponse],
    summary="Kitchen Order Queue",
    description=(
        "Returns all active orders that the kitchen needs to act on "
        "(Pending, Accepted, Cooking, Preparing). "
        "Results are sorted oldest-first so chefs see the most urgent orders at the top."
    ),
)
async def get_kitchen_queue(
    status: Optional[str] = Query(
        None,
        description="Filter by a single kitchen status: Pending | Accepted | Cooking | Preparing"
    ),
    table_number: Optional[str] = Query(None, description="Filter by table number"),
    current_user: dict = Depends(get_current_user),
):
    query: dict = {"status": {"$in": KITCHEN_ACTIVE_STATUSES}}

    if status:
        if status not in KITCHEN_ACTIVE_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"'status' must be one of {KITCHEN_ACTIVE_STATUSES} for kitchen queue."
            )
        query["status"] = status

    if table_number:
        query["table_number"] = table_number

    orders = []
    # Sort ascending (oldest first) so the chef sees longest-waiting orders first
    async for doc in orders_collection.find(query).sort("created_at", 1):
        orders.append(_doc_to_order_response(doc))
    return orders


# ===========================================================================
# 2. GET  /api/kitchen/queue/summary  — Live status counts
# ===========================================================================
@router.get(
    "/queue/summary",
    response_model=StandardAPIResponse,
    summary="Kitchen Queue Summary",
    description="Returns a real-time count of orders grouped by kitchen status. Useful for KDS dashboards.",
)
async def get_kitchen_queue_summary(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"status": {"$in": KITCHEN_ACTIVE_STATUSES}}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    summary: dict = {s: 0 for s in KITCHEN_ACTIVE_STATUSES}
    async for doc in orders_collection.aggregate(pipeline):
        summary[doc["_id"]] = doc["count"]

    total_active = sum(summary.values())
    return StandardAPIResponse(
        success=True,
        message="Kitchen queue summary fetched successfully.",
        data={"counts": summary, "total_active": total_active},
    )


# ===========================================================================
# 3. GET  /api/kitchen/order/{order_identifier}  — Single order lookup
# ===========================================================================
@router.get(
    "/order/{order_identifier}",
    response_model=OrderResponse,
    summary="Kitchen – Get Order Detail",
    description="Fetch full detail of a single order by order_id, id, or MongoDB _id.",
)
async def kitchen_get_order(
    order_identifier: str,
    current_user: dict = Depends(get_current_user),
):
    query = _build_order_query(order_identifier)
    doc = await orders_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Order '{order_identifier}' not found.")
    return _doc_to_order_response(doc)


# ===========================================================================
# 4. PATCH / PUT  /api/kitchen/order/{order_identifier}/status
#    General status update with transition validation
# ===========================================================================
@router.patch(
    "/order/{order_identifier}/status",
    response_model=StandardAPIResponse,
    summary="Kitchen – Update Order Status",
)
@router.put(
    "/order/{order_identifier}/status",
    response_model=StandardAPIResponse,
    summary="Kitchen – Update Order Status (PUT alias)",
)
async def kitchen_update_order_status(
    order_identifier: str,
    payload: KitchenStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Updates the kitchen status of an order.
    Validates that the transition is legal (e.g. Pending → Accepted → Cooking → Ready).
    """
    query = _build_order_query(order_identifier)
    doc = await orders_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Order '{order_identifier}' not found.")

    current_status = doc.get("status", "Pending")
    new_status = payload.status

    if new_status not in [s for s in KITCHEN_VALID_TRANSITIONS.get(current_status, [])]:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Invalid transition: '{current_status}' → '{new_status}'. "
                f"Allowed next statuses: {KITCHEN_VALID_TRANSITIONS.get(current_status, [])}."
            ),
        )

    update_fields: dict = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.note:
        update_fields["kitchen_note"] = payload.note

    await orders_collection.update_one(query, {"$set": update_fields})
    updated_order = {**doc, **update_fields}
    if new_status in {"Ready", "Completed"}:
        updated_order = await complete_paid_ready_order(updated_order)

    actor = current_user.get("name", "Chef")
    await _kitchen_notify(
        order_id=doc.get("order_id", order_identifier),
        table_number=doc.get("table_number", "?"),
        new_status=updated_order.get("status", new_status),
        actor=actor,
    )

    return StandardAPIResponse(
        success=True,
        message=f"Order status updated: '{current_status}' → '{updated_order.get('status', new_status)}'.",
        data={
            "order_id": doc.get("order_id", order_identifier),
            "previous_status": current_status,
            "new_status": updated_order.get("status", new_status),
            "updated_by": actor,
        },
    )


# ===========================================================================
# 5. PATCH /api/kitchen/order/{order_identifier}/item-status
#    Mark an individual order item as prepared
# ===========================================================================
@router.patch(
    "/order/{order_identifier}/item-status",
    response_model=StandardAPIResponse,
    summary="Kitchen – Mark Individual Item as Prepared",
    description=(
        "Sets a `done` flag on a specific item within an order. "
        "Useful for multi-item orders where items finish at different times."
    ),
)
async def kitchen_update_item_status(
    order_identifier: str,
    payload: ItemStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    query = _build_order_query(order_identifier)
    doc = await orders_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Order '{order_identifier}' not found.")

    items: List[dict] = doc.get("items", [])
    matched = False
    for item in items:
        if item.get("item_id") == payload.item_id or item.get("name") == payload.item_id:
            item["done"] = payload.done
            matched = True
            break

    if not matched:
        raise HTTPException(
            status_code=404,
            detail=f"Item '{payload.item_id}' not found in order '{order_identifier}'."
        )

    await orders_collection.update_one(query, {"$set": {"items": items}})

    all_done = all(i.get("done", False) for i in items)
    return StandardAPIResponse(
        success=True,
        message=(
            f"Item '{payload.item_id}' marked as {'done' if payload.done else 'pending'}. "
            + ("All items complete – consider marking order as Ready." if all_done else "")
        ),
        data={
            "order_id": doc.get("order_id", order_identifier),
            "item_id": payload.item_id,
            "done": payload.done,
            "all_items_done": all_done,
        },
    )


# ===========================================================================
# 6. POST /api/kitchen/order/{order_identifier}/accept
#    One-click Accept shortcut: Pending → Accepted
# ===========================================================================
@router.post(
    "/order/{order_identifier}/accept",
    response_model=StandardAPIResponse,
    summary="Kitchen – Accept Order",
    description="Shortcut to transition an order from Pending to Accepted.",
)
async def kitchen_accept_order(
    order_identifier: str,
    current_user: dict = Depends(get_current_user),
):
    query = _build_order_query(order_identifier)
    doc = await orders_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Order '{order_identifier}' not found.")

    if doc.get("status") != "Pending":
        raise HTTPException(
            status_code=422,
            detail=f"Only Pending orders can be accepted. Current status: '{doc.get('status')}'."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    await orders_collection.update_one(
        query,
        {"$set": {"status": "Accepted", "accepted_at": now_iso, "updated_at": now_iso}},
    )

    actor = current_user.get("name", "Chef")
    await _kitchen_notify(doc.get("order_id", order_identifier), doc.get("table_number", "?"), "Accepted", actor)

    return StandardAPIResponse(
        success=True,
        message=f"Order '{doc.get('order_id', order_identifier)}' accepted by kitchen.",
        data={"order_id": doc.get("order_id", order_identifier), "status": "Accepted", "accepted_by": actor},
    )


# ===========================================================================
# 7. POST /api/kitchen/order/{order_identifier}/start
#    One-click Start Cooking: Accepted/Preparing → Cooking
# ===========================================================================
@router.post(
    "/order/{order_identifier}/start",
    response_model=StandardAPIResponse,
    summary="Kitchen – Start Cooking",
    description="Transitions an Accepted/Preparing order to Cooking status.",
)
async def kitchen_start_cooking(
    order_identifier: str,
    current_user: dict = Depends(get_current_user),
):
    query = _build_order_query(order_identifier)
    doc = await orders_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Order '{order_identifier}' not found.")

    allowed_from = ["Accepted", "Preparing"]
    if doc.get("status") not in allowed_from:
        raise HTTPException(
            status_code=422,
            detail=f"Can only start cooking from {allowed_from}. Current status: '{doc.get('status')}'."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    await orders_collection.update_one(
        query,
        {"$set": {"status": "Cooking", "cooking_started_at": now_iso, "updated_at": now_iso}},
    )

    actor = current_user.get("name", "Chef")
    await _kitchen_notify(doc.get("order_id", order_identifier), doc.get("table_number", "?"), "Cooking", actor)

    return StandardAPIResponse(
        success=True,
        message=f"Cooking started for order '{doc.get('order_id', order_identifier)}'.",
        data={"order_id": doc.get("order_id", order_identifier), "status": "Cooking", "started_by": actor},
    )


# ===========================================================================
# 8. POST /api/kitchen/order/{order_identifier}/ready
#    Mark Food Ready: Cooking → Ready
# ===========================================================================
@router.post(
    "/order/{order_identifier}/ready",
    response_model=StandardAPIResponse,
    summary="Kitchen – Mark Order Ready",
    description="Marks a Cooking order as Ready for serving. Notifies cashier and front-of-house.",
)
async def kitchen_mark_ready(
    order_identifier: str,
    current_user: dict = Depends(get_current_user),
):
    query = _build_order_query(order_identifier)
    doc = await orders_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Order '{order_identifier}' not found.")

    if doc.get("status") != "Cooking":
        raise HTTPException(
            status_code=422,
            detail=f"Only Cooking orders can be marked Ready. Current status: '{doc.get('status')}'."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    await orders_collection.update_one(
        query,
        {"$set": {"status": "Ready", "ready_at": now_iso, "updated_at": now_iso}},
    )
    updated_order = await complete_paid_ready_order({**doc, "status": "Ready", "ready_at": now_iso, "updated_at": now_iso})

    actor = current_user.get("name", "Chef")
    await _kitchen_notify(
        doc.get("order_id", order_identifier),
        doc.get("table_number", "?"),
        updated_order.get("status", "Ready"),
        actor,
    )

    return StandardAPIResponse(
        success=True,
        message=f"Order '{doc.get('order_id', order_identifier)}' is {updated_order.get('status', 'Ready').lower()}.",
        data={
            "order_id": doc.get("order_id", order_identifier),
            "status": updated_order.get("status", "Ready"),
            "marked_by": actor,
        },
    )


# ===========================================================================
# 9. POST /api/kitchen/order/{order_identifier}/cancel
#    Cancel an active order from the kitchen side
# ===========================================================================
@router.post(
    "/order/{order_identifier}/cancel",
    response_model=StandardAPIResponse,
    summary="Kitchen – Cancel Order",
    description="Cancels an active order. Only orders that are not yet Completed can be cancelled.",
)
async def kitchen_cancel_order(
    order_identifier: str,
    reason: Optional[str] = Query(None, description="Reason for cancellation"),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ["chef", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only chefs or admins are authorized to cancel orders from the kitchen."
        )

    query = _build_order_query(order_identifier)
    doc = await orders_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Order '{order_identifier}' not found.")

    if doc.get("status") in ["Completed", "Cancelled"]:
        raise HTTPException(
            status_code=422,
            detail=f"Order is already '{doc.get('status')}' and cannot be cancelled."
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    # If order was paid, mark as Refunded; if unpaid, clear payment status
    payment_update = {}
    if doc.get("payment_status") == "Paid":
        payment_update["payment_status"] = "Refunded"
    else:
        payment_update["payment_status"] = "Cancelled"

    await orders_collection.update_one(
        query,
        {"$set": {
            "status": "Cancelled",
            "cancelled_at": now_iso,
            "updated_at": now_iso,
            "cancel_reason": reason or "Cancelled by kitchen",
            **payment_update,
        }},
    )

    # Reset table status to Available and clear reservation
    t_num = doc.get("table_number")
    if t_num:
        await tables_collection.update_one(
            {"table_number": t_num},
            {"$set": {"status": "Available"}, "$unset": {"reserved_by_name": "", "reserved_by_user_id": "", "reservation_id": "", "reserved_at": ""}}
        )
        try:
            from database import bookings_collection, customer_sessions_collection
            booking_id = doc.get("booking_id")
            booking_query = {"id": booking_id} if booking_id else {"table_number": t_num, "status": "Active"}
            await bookings_collection.update_many(booking_query, {"$set": {"status": "Cancelled", "released_at": now_iso}})
            if booking_id:
                await customer_sessions_collection.update_many({"booking_id": booking_id}, {"$set": {"status": "expired", "ended_at": now_iso, "end_reason": "Order cancelled"}})
        except Exception as err:
            print(f"[WARN] Booking/table cleanup warning: {err}")

    actor = current_user.get("name", "Chef")
    await _kitchen_notify(doc.get("order_id", order_identifier), doc.get("table_number", "?"), "Cancelled", actor)

    return StandardAPIResponse(
        success=True,
        message=f"Order '{doc.get('order_id', order_identifier)}' has been cancelled.",
        data={
            "order_id": doc.get("order_id", order_identifier),
            "status": "Cancelled",
            "reason": reason or "Cancelled by kitchen",
            "cancelled_by": actor,
        },
    )


# ===========================================================================
# 10. GET /api/kitchen/stats  — Today's kitchen performance metrics
# ===========================================================================
@router.get(
    "/stats",
    response_model=StandardAPIResponse,
    summary="Kitchen – Daily Stats",
    description=(
        "Returns today's kitchen performance metrics: total orders, completed, cancelled, "
        "and a breakdown of orders still active per status."
    ),
)
async def get_kitchen_stats(current_user: dict = Depends(get_current_user)):
    # Today's date prefix in ISO format (YYYY-MM-DD)
    today_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Aggregate all orders created today
    pipeline = [
        {"$match": {"created_at": {"$regex": f"^{today_prefix}"}}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]

    counts: dict = {}
    async for doc in orders_collection.aggregate(pipeline):
        counts[doc["_id"]] = doc["count"]

    total_today = sum(counts.values())
    completed = counts.get("Completed", 0)
    cancelled = counts.get("Cancelled", 0)
    active_in_kitchen = sum(counts.get(s, 0) for s in KITCHEN_ACTIVE_STATUSES)

    return StandardAPIResponse(
        success=True,
        message="Kitchen stats for today fetched successfully.",
        data={
            "date": today_prefix,
            "total_orders_today": total_today,
            "completed": completed,
            "cancelled": cancelled,
            "active_in_kitchen": active_in_kitchen,
            "breakdown": counts,
        },
    )
