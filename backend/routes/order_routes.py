import asyncio
import base64
import hashlib
import hmac
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from bson import ObjectId
from config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, USD_TO_INR_RATE, get_razorpay_credentials, usd_to_inr_paise, inr_to_paise
from database import orders_collection, notifications_collection, tables_collection, menu_items_collection
from models.schemas import (
    CreateOrderRequest, TableOrderCreateRequest, AppendItemsRequest,
    OrderResponse, OrderStatusUpdateRequest, PaymentUpdateRequest, StandardAPIResponse,
    AdminCancelRequest, RazorpayOrderResponse, RazorpayPaymentVerificationRequest
)
from utils.security import get_current_cashier_or_admin, get_current_user
from services.order_completion import complete_paid_ready_order

router = APIRouter(prefix="/api/orders", tags=["Order Management"])

VALID_STATUSES = ["Pending", "Accepted", "Cooking", "Ready", "Completed", "Cancelled", "Preparing"]

async def _find_menu_item_for_order_item(item: dict) -> dict | None:
    item_id = item.get("item_id")
    if not item_id:
        return None

    query = {"$or": [{"id": item_id}, {"_id": item_id}]}
    if ObjectId.is_valid(str(item_id)):
        query["$or"].append({"_id": ObjectId(str(item_id))})

    return await menu_items_collection.find_one(query)


async def _normalize_order_items(items: list[dict]) -> list[dict]:
    normalized_items = []

    for item in items or []:
        normalized_item = dict(item)
        if not normalized_item.get("image_url"):
            menu_item = await _find_menu_item_for_order_item(normalized_item)
            if menu_item and menu_item.get("image_url"):
                normalized_item["image_url"] = menu_item.get("image_url")

        normalized_items.append(normalized_item)

    return normalized_items


def _build_order_query(order_identifier: str) -> dict:
    """
    Multi-field order lookup query builder supporting:
    - Custom string ID (id: 'ord_1725081234')
    - Custom human order ID (order_id: 'ORD-1725081234')
    - MongoDB string _id ('6a952bed80269e7949d785c6')
    - MongoDB BSON ObjectId
    """
    conditions = [
        {"id": order_identifier},
        {"order_id": order_identifier},
        {"_id": order_identifier}
    ]
    clean_id = order_identifier[4:] if order_identifier.startswith("ord_") else order_identifier
    if ObjectId.is_valid(clean_id):
        conditions.append({"_id": ObjectId(clean_id)})
        conditions.append({"id": clean_id})
    if ObjectId.is_valid(order_identifier):
        conditions.append({"_id": ObjectId(order_identifier)})
    return {"$or": conditions}


def _require_razorpay_config() -> tuple[str, str]:
    key_id, key_secret = get_razorpay_credentials()
    if not key_id:
        raise HTTPException(
            status_code=503,
            detail="Online payments are not configured because RAZORPAY_KEY_ID is missing from backend/.env.",
        )
    if not key_secret:
        raise HTTPException(
            status_code=503,
            detail="Online payments are not configured because RAZORPAY_KEY_SECRET is missing from backend/.env. Add the matching Razorpay test secret and restart the backend.",
        )
    return key_id, key_secret


_usd_to_inr_paise = usd_to_inr_paise
_inr_to_paise = inr_to_paise


def _payment_amount_candidates(order: dict) -> set[int]:
    candidates: set[int] = set()
    for value in (
        order.get("payment_amount_paise"),
        _inr_to_paise(float(order.get("total_amount", 0) or 0)),
        _usd_to_inr_paise(float(order.get("total_amount", 0) or 0)),
    ):
        if value is None:
            continue
        try:
            candidates.add(int(value))
        except (TypeError, ValueError):
            continue
    return candidates


def _razorpay_request(method: str, path: str, payload: dict | None = None) -> dict:
    key_id, key_secret = _require_razorpay_config()
    credentials = base64.b64encode(
        f"{key_id}:{key_secret}".encode("utf-8")
    ).decode("ascii")
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        f"https://api.razorpay.com/v1/{path.lstrip('/')}",
        data=body,
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="ignore")
        raise HTTPException(
            status_code=error.code if error.code in (400, 401, 404) else 502,
            detail=f"Razorpay error ({error.code}): {error_body[:200] if error_body else error.reason}",
        ) from error
    except (urllib.error.URLError, TimeoutError) as error:
        raise HTTPException(
            status_code=502,
            detail="Razorpay is temporarily unavailable. Please retry or pay at the counter.",
        ) from error
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise HTTPException(
            status_code=502,
            detail="Razorpay returned an invalid response. Please retry or pay at the counter.",
        ) from error


def _payment_fields(order: dict) -> dict:
    return {
        "payment_method": order.get("payment_method"),
        "paid_at": order.get("paid_at"),
        "payment_currency": order.get("payment_currency"),
        "paid_amount": order.get("paid_amount"),
        "payment_exchange_rate": order.get("payment_exchange_rate", USD_TO_INR_RATE),
        "payment_amount_paise": order.get("payment_amount_paise"),
        "razorpay_order_id": order.get("razorpay_order_id"),
        "razorpay_payment_id": order.get("razorpay_payment_id"),
    }

@router.post("", response_model=OrderResponse)
async def create_order(payload: CreateOrderRequest):
    """
    Public Customer Order Placement (No Login Required):
    - Validates table number
    - Calculates total order price
    - Sets initial status to 'Pending'
    - Creates real-time system notification for Chef & Cashier
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="Order cart cannot be empty.")
    
    total = sum(item.price * item.quantity for item in payload.items)
    now = datetime.now(timezone.utc)
    ms_ts = int(now.timestamp() * 1000)
    order_id = f"ORD-{ms_ts}"
    db_id = f"ord_{ms_ts}"
    created_at_str = now.isoformat()

    normalized_items = await _normalize_order_items([item.dict() for item in payload.items])

    order_doc = {
        "id": db_id,
        "order_id": order_id,
        "table_number": payload.table_number,
        "customer_name": payload.customer_name or "Guest Customer",
        "items": normalized_items,
        "total_amount": round(total, 2),
        "status": "Pending",
        "payment_status": "Unpaid",
        "payment_currency": "INR",
        "payment_amount_paise": _usd_to_inr_paise(total),
        "payment_exchange_rate": USD_TO_INR_RATE,
        "special_instructions": payload.special_instructions or "",
        "created_at": created_at_str
    }

    await orders_collection.insert_one(order_doc)

    # Update table status to Occupied
    try:
        await tables_collection.update_one(
            {"table_number": payload.table_number},
            {"$set": {"status": "Occupied"}}
        )
    except Exception as err:
        print(f"[WARN] Table status auto-update error: {err}")

    # Generate Notification for Chef & Cashier
    try:
        now_ts = int(now.timestamp())
        await notifications_collection.insert_one({
            "id": f"ntf_{now_ts}",
            "title": f"New Order {order_id}",
            "message": f"Table {payload.table_number} placed order of {len(payload.items)} items ($ {round(total, 2)}).",
            "type": "order",
            "target_role": "all",
            "created_at": created_at_str,
            "is_read": False
        })
    except Exception as err:
        print(f"[WARN] Notification creation warning: {err}")

    return OrderResponse(**order_doc)

@router.get("", response_model=List[OrderResponse])
async def list_orders(
    status: Optional[str] = Query(None, description="Filter orders by status: Pending, Accepted, Preparing, Ready, Completed"),
    table_number: Optional[str] = None
):
    """
    List orders for Cashier, Chef, and Admin interfaces.
    """
    query = {}
    if status and status.lower() != "all":
        query["status"] = status
    if table_number:
        query["table_number"] = table_number

    orders = []
    try:
        cursor = orders_collection.find(query).sort("created_at", -1)
        async for doc in cursor:
            orders.append(OrderResponse(
                id=doc.get("id", str(doc.get("_id"))),
                order_id=doc.get("order_id", "ORD-000"),
                table_number=doc.get("table_number", "1"),
                customer_name=doc.get("customer_name", "Guest"),
                items=await _normalize_order_items(doc.get("items", [])),
                total_amount=float(doc.get("total_amount", 0.0)),
                status=doc.get("status", "Pending"),
                payment_status=doc.get("payment_status", "Unpaid"),
                **_payment_fields(doc),
                special_instructions=doc.get("special_instructions", ""),
                created_at=doc.get("created_at") or "",
                order_token=doc.get("order_token") or doc.get("display_token"),
            ))
    except Exception as err:
        print(f"[WARN] Error fetching orders: {err}")
    return orders

# ----------------------------------------------------
# 🪑 TABLE-WISE ORDER CREATION & MANAGEMENT APIS
# ----------------------------------------------------

@router.post("/table/{table_number}", response_model=OrderResponse)
async def create_table_wise_order(table_number: str, payload: TableOrderCreateRequest):
    """
    Table-Wise Order Creation API:
    - Places an order directly bound to a dining table
    - Marks dining table status to Occupied
    - Triggers kitchen & cashier notification
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="Order items list cannot be empty.")

    total = sum(item.price * item.quantity for item in payload.items)
    now = datetime.now(timezone.utc)
    ms_ts = int(now.timestamp() * 1000)
    order_id = f"ORD-{ms_ts}"
    db_id = f"ord_{ms_ts}"
    created_at_str = now.isoformat()

    normalized_items = await _normalize_order_items([item.dict() for item in payload.items])

    order_doc = {
        "id": db_id,
        "order_id": order_id,
        "table_number": table_number,
        "customer_name": payload.customer_name or f"Table #{table_number} Guest",
        "items": normalized_items,
        "total_amount": round(total, 2),
        "status": "Pending",
        "payment_status": "Unpaid",
        "payment_currency": "INR",
        "payment_amount_paise": _usd_to_inr_paise(total),
        "payment_exchange_rate": USD_TO_INR_RATE,
        "special_instructions": payload.special_instructions or "",
        "created_at": created_at_str
    }

    await orders_collection.insert_one(order_doc)

    # Set table status to Occupied
    try:
        await tables_collection.update_one(
            {"table_number": table_number},
            {"$set": {"status": "Occupied"}},
            upsert=True
        )
    except Exception as err:
        print(f"[WARN] Table status update warning: {err}")

    # Generate Notification
    try:
        now_ts = int(now.timestamp())
        await notifications_collection.insert_one({
            "id": f"ntf_tbl_{now_ts}",
            "title": f"New Table {table_number} Order",
            "message": f"Table #{table_number} placed order {order_id} ({len(payload.items)} items, ${round(total, 2)}).",
            "type": "order",
            "target_role": "all",
            "created_at": created_at_str,
            "is_read": False
        })
    except Exception as err:
        print(f"[WARN] Notification creation warning: {err}")

    return OrderResponse(**order_doc)

@router.get("/table/{table_number}", response_model=List[OrderResponse])
async def get_table_orders_history(table_number: str):
    """
    Get all order records for a specific table number.
    """
    orders = []
    cursor = orders_collection.find({"table_number": table_number}).sort("created_at", -1)
    async for doc in cursor:
        orders.append(OrderResponse(
            id=doc.get("id", str(doc.get("_id"))),
            order_id=doc.get("order_id", "ORD-000"),
            table_number=doc.get("table_number", table_number),
            customer_name=doc.get("customer_name", "Guest"),
            items=await _normalize_order_items(doc.get("items", [])),
            total_amount=float(doc.get("total_amount", 0.0)),
            status=doc.get("status", "Pending"),
            payment_status=doc.get("payment_status", "Unpaid"),
            **_payment_fields(doc),
            special_instructions=doc.get("special_instructions", ""),
            created_at=doc.get("created_at") or "",
            order_token=doc.get("order_token") or doc.get("display_token"),
        ))
    return orders

@router.get("/table/{table_number}/active", response_model=OrderResponse)
async def get_table_active_order(table_number: str):
    """
    Get current active ongoing order for a table (Status != Completed and Status != Cancelled).
    """
    order = await orders_collection.find_one({
        "table_number": table_number,
        "status": {"$nin": ["Completed", "Cancelled"]}
    })
    if not order:
        raise HTTPException(status_code=404, detail=f"No active ongoing order found for Table {table_number}.")

    return OrderResponse(
        id=order.get("id", str(order.get("_id"))),
        order_id=order.get("order_id", "ORD-000"),
        table_number=order.get("table_number", table_number),
        customer_name=order.get("customer_name", "Guest"),
        items=await _normalize_order_items(order.get("items", [])),
        total_amount=float(order.get("total_amount", 0.0)),
        status=order.get("status", "Pending"),
        payment_status=order.get("payment_status", "Unpaid"),
        **_payment_fields(order),
        special_instructions=order.get("special_instructions", ""),
        created_at=order.get("created_at", ""),
        order_token=order.get("order_token") or order.get("display_token"),
    )

@router.post("/table/{table_number}/append", response_model=OrderResponse)
async def append_items_to_active_table_order(table_number: str, payload: AppendItemsRequest):
    """
    Append extra items to an ongoing active order for a dining table.
    If no active order exists, creates a new table order.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="No items specified to append.")

    active_order = await orders_collection.find_one({
        "table_number": table_number,
        "status": {"$nin": ["Completed", "Cancelled"]}
    })

    if not active_order:
        # Create new order if no active order exists
        create_req = TableOrderCreateRequest(
            customer_name=f"Table #{table_number} Guest",
            items=payload.items,
            special_instructions=payload.special_instructions
        )
        return await create_table_wise_order(table_number, create_req)

    # Append items to active order
    existing_items = active_order.get("items", [])
    new_items = [item.dict() for item in payload.items]
    updated_items = await _normalize_order_items(existing_items + new_items)

    new_total = round(sum(float(item.get("price", 0.0)) * int(item.get("quantity", 1)) for item in updated_items), 2)
    instructions = active_order.get("special_instructions", "")
    if payload.special_instructions:
        instructions = f"{instructions} | Appended: {payload.special_instructions}".strip(" |")

    order_id = active_order.get("order_id", "ORD-000")

    await orders_collection.update_one(
        {"_id": active_order["_id"]},
        {"$set": {
            "items": updated_items,
            "total_amount": new_total,
            "payment_amount_paise": _usd_to_inr_paise(new_total),
            "payment_exchange_rate": USD_TO_INR_RATE,
            "special_instructions": instructions
        }}
    )

    # Trigger notification for added dishes
    now_ts = int(datetime.now(timezone.utc).timestamp())
    try:
        await notifications_collection.insert_one({
            "id": f"ntf_app_{now_ts}",
            "title": f"Items Appended to {order_id}",
            "message": f"Table #{table_number} added {len(payload.items)} extra item(s) to order {order_id}.",
            "type": "order",
            "target_role": "all",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_read": False
        })
    except Exception as err:
        print(f"[WARN] Notification creation warning: {err}")

    updated_doc = await orders_collection.find_one({"_id": active_order["_id"]})
    return OrderResponse(
        id=updated_doc.get("id", str(updated_doc.get("_id"))),
        order_id=updated_doc.get("order_id", "ORD-000"),
        table_number=updated_doc.get("table_number", table_number),
        customer_name=updated_doc.get("customer_name", "Guest"),
        items=updated_doc.get("items", []),
        total_amount=float(updated_doc.get("total_amount", 0.0)),
        status=updated_doc.get("status", "Pending"),
        payment_status=updated_doc.get("payment_status", "Unpaid"),
        **_payment_fields(updated_doc),
        special_instructions=updated_doc.get("special_instructions", ""),
        created_at=updated_doc.get("created_at") or ""
    )

# ----------------------------------------------------
# 🔍 PARAMETERIZED SINGLE ORDER LOOKUP & UPDATES
# ----------------------------------------------------

@router.get("/{order_identifier}", response_model=OrderResponse)
async def get_order_by_id(order_identifier: str):
    """
    Get order details for real-time customer tracking or kitchen panel lookup.
    Supports order_id ('ORD-...'), custom id ('ord_...'), MongoDB string _id, or ObjectId.
    """
    query = _build_order_query(order_identifier)
    order = await orders_collection.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Auto-reconcile online payments if Razorpay marked the order as paid but callback was missed
    if (
        order.get("payment_status") != "Paid"
        and order.get("payment_method") == "Online"
        and order.get("razorpay_order_id")
    ):
        try:
            key_id, key_secret = get_razorpay_credentials()
            if key_id and key_secret:
                gw_order = await asyncio.to_thread(
                    _razorpay_request,
                    "GET",
                    f"orders/{order.get('razorpay_order_id')}",
                )
                if gw_order.get("status") == "paid" or (
                    int(gw_order.get("amount_due", 1) or 0) == 0
                    and int(gw_order.get("amount_paid", 0) or 0) > 0
                ):
                    payments_resp = await asyncio.to_thread(
                        _razorpay_request,
                        "GET",
                        f"orders/{order.get('razorpay_order_id')}/payments",
                    )
                    items = payments_resp.get("items", []) if isinstance(payments_resp, dict) else []
                    captured_payment = next(
                        (p for p in items if p.get("status") == "captured" or p.get("captured")),
                        items[0] if items else {}
                    )
                    payment_id = captured_payment.get("id") or None
                    paid_at = datetime.now(timezone.utc).isoformat()
                    captured_amount_paise = int(gw_order.get("amount_paid") or 0)
                    await orders_collection.update_one(
                        {"_id": order["_id"], "payment_status": "Unpaid"},
                        {"$set": {
                            "payment_status": "Paid",
                            "payment_amount_paise": captured_amount_paise,
                            "paid_amount": (captured_amount_paise / 100) if captured_amount_paise else float(order.get("total_amount", 0.0)),
                            "paid_at": paid_at,
                            "razorpay_payment_id": payment_id,
                        }}
                    )
                    order["payment_status"] = "Paid"
                    order["paid_at"] = paid_at
                    order["razorpay_payment_id"] = payment_id
                    if captured_amount_paise:
                        order["paid_amount"] = captured_amount_paise / 100
                    await complete_paid_ready_order(order)
        except Exception:
            pass

    return OrderResponse(
        id=order.get("id", str(order.get("_id"))),
        order_id=order.get("order_id", "ORD-000"),
        table_number=order.get("table_number", "1"),
        customer_name=order.get("customer_name", "Guest"),
        items=await _normalize_order_items(order.get("items", [])),
        total_amount=float(order.get("total_amount", 0.0)),
        status=order.get("status", "Pending"),
        payment_status=order.get("payment_status", "Unpaid"),
        **_payment_fields(order),
        special_instructions=order.get("special_instructions", ""),
        created_at=order.get("created_at") or "",
        order_token=order.get("order_token") or order.get("display_token"),
    )


@router.post("/{order_identifier}/online-payment/order", response_model=RazorpayOrderResponse)
async def create_online_payment_order(
    order_identifier: str,
    current_user: dict = Depends(get_current_user),
):
    key_id, _ = _require_razorpay_config()
    if current_user.get("role") != "user":
        raise HTTPException(status_code=403, detail="Only the customer who placed this order can pay online.")

    query = _build_order_query(order_identifier)
    order = await orders_collection.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.get("customer_user_id") != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="You can only pay for your own order.")
    if order.get("status") == "Cancelled":
        raise HTTPException(status_code=409, detail="Cancelled orders cannot be paid.")
    if order.get("payment_status") == "Paid":
        raise HTTPException(status_code=409, detail="This order has already been paid.")
    if order.get("payment_method") != "Online":
        raise HTTPException(status_code=409, detail="Online payment was not selected for this order.")

    expected_paise = _usd_to_inr_paise(float(order.get("total_amount", 0) or 0))
    amount_paise = order.get("payment_amount_paise")
    if amount_paise is None or amount_paise != expected_paise:
        amount_paise = expected_paise
    if amount_paise <= 0:
        raise HTTPException(status_code=400, detail="The order total must be greater than zero.")
    amount_paise = int(amount_paise)

    razorpay_order_id = order.get("razorpay_order_id")
    needs_new_razorpay_order = not razorpay_order_id

    if razorpay_order_id:
        try:
            gw_order = await asyncio.to_thread(
                _razorpay_request,
                "GET",
                f"orders/{razorpay_order_id}",
            )
            # If the order is already paid on Razorpay, auto-reconcile and complete it!
            if gw_order.get("status") == "paid" or (
                int(gw_order.get("amount_due", 1) or 0) == 0
                and int(gw_order.get("amount_paid", 0) or 0) > 0
            ):
                payments_resp = await asyncio.to_thread(
                    _razorpay_request,
                    "GET",
                    f"orders/{razorpay_order_id}/payments",
                )
                items = payments_resp.get("items", []) if isinstance(payments_resp, dict) else []
                captured_payment = next(
                    (p for p in items if p.get("status") == "captured" or p.get("captured")),
                    items[0] if items else {}
                )
                payment_id = captured_payment.get("id") or None
                paid_at = datetime.now(timezone.utc).isoformat()
                captured_amount_paise = int(gw_order.get("amount_paid") or amount_paise)
                await orders_collection.update_one(
                    {"_id": order["_id"]},
                    {"$set": {
                        "payment_status": "Paid",
                        "payment_method": "Online",
                        "payment_currency": "INR",
                        "payment_amount_paise": captured_amount_paise,
                        "paid_amount": captured_amount_paise / 100,
                        "paid_at": paid_at,
                        "razorpay_payment_id": payment_id,
                    }}
                )
                await complete_paid_ready_order({
                    **order,
                    "payment_status": "Paid",
                    "payment_method": "Online",
                    "razorpay_payment_id": payment_id,
                })
                raise HTTPException(status_code=409, detail="This order has already been paid.")

            # If existing order is open and matches requested amount, reuse it
            if (
                gw_order.get("status") in ("created", "attempted")
                and int(gw_order.get("amount", 0)) == amount_paise
                and gw_order.get("currency") == "INR"
            ):
                needs_new_razorpay_order = False
            else:
                needs_new_razorpay_order = True
        except HTTPException:
            raise
        except Exception as e:
            # Stale order ID from previous key, expired order, or not found on current merchant account
            print(f"[INFO] Razorpay order {razorpay_order_id} unusable under current key: {e}. Generating new Razorpay order.")
            needs_new_razorpay_order = True

    if needs_new_razorpay_order:
        gateway_order = await asyncio.to_thread(
            _razorpay_request,
            "POST",
            "orders",
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": order.get("order_id", order_identifier)[:40],
                "notes": {"restaurant_order_id": order.get("order_id", order_identifier)},
            },
        )
        if (
            not gateway_order.get("id")
            or gateway_order.get("amount") != amount_paise
            or gateway_order.get("currency") != "INR"
        ):
            raise HTTPException(status_code=502, detail="Razorpay returned an invalid order amount.")
        created_razorpay_order_id = gateway_order["id"]
        update_result = await orders_collection.update_one(
            {
                "_id": order["_id"],
                "payment_status": "Unpaid",
            },
            {"$set": {
                "razorpay_order_id": created_razorpay_order_id,
                "payment_currency": "INR",
                "payment_amount_paise": amount_paise,
                "payment_exchange_rate": USD_TO_INR_RATE,
            }},
        )
        if update_result.modified_count == 1:
            razorpay_order_id = created_razorpay_order_id
        else:
            refreshed_order = await orders_collection.find_one({"_id": order["_id"]})
            razorpay_order_id = refreshed_order.get("razorpay_order_id") if refreshed_order else created_razorpay_order_id
            if not razorpay_order_id or refreshed_order.get("payment_status") != "Unpaid":
                raise HTTPException(
                    status_code=409,
                    detail="The order changed while payment was being prepared. Refresh and try again.",
                )
            amount_paise = refreshed_order.get("payment_amount_paise", amount_paise)

    return RazorpayOrderResponse(
        key_id=key_id,
        razorpay_order_id=razorpay_order_id,
        amount=amount_paise,
        currency="INR",
        exchange_rate=USD_TO_INR_RATE,
        amount_inr=round(amount_paise / 100, 2),
        amount_usd=float(order.get("total_amount", 0.0)),
    )


@router.post("/{order_identifier}/online-payment/verify", response_model=StandardAPIResponse)
async def verify_online_order_payment(
    order_identifier: str,
    payload: RazorpayPaymentVerificationRequest,
    current_user: dict = Depends(get_current_user),
):
    key_id, key_secret = _require_razorpay_config()
    if current_user.get("role") != "user":
        raise HTTPException(status_code=403, detail="Only the customer who placed this order can verify payment.")

    query = _build_order_query(order_identifier)
    order = await orders_collection.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.get("customer_user_id") != current_user.get("sub"):
        raise HTTPException(status_code=403, detail="You can only verify payment for your own order.")
    if order.get("razorpay_order_id") != payload.razorpay_order_id:
        raise HTTPException(status_code=400, detail="The Razorpay order does not match this restaurant order.")

    expected_signature = hmac.new(
        key_secret.encode("utf-8"),
        f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Razorpay payment signature is invalid.")

    if order.get("payment_status") == "Paid":
        if order.get("razorpay_payment_id") == payload.razorpay_payment_id:
            await complete_paid_ready_order(order)
            return StandardAPIResponse(
                success=True,
                message="This Razorpay payment was already recorded.",
                data={"order_id": order.get("order_id"), "payment_status": "Paid"},
            )
        raise HTTPException(status_code=409, detail="This order has already been paid using another transaction.")

    amount_paise = order.get("payment_amount_paise")
    if amount_paise is None:
        amount_paise = _usd_to_inr_paise(float(order.get("total_amount", 0) or 0))
    amount_paise = int(amount_paise)
    payment = await asyncio.to_thread(
        _razorpay_request,
        "GET",
        f"payments/{quote(payload.razorpay_payment_id, safe='')}",
    )
    expected_amounts = _payment_amount_candidates(order)
    actual_amount = int(payment.get("amount") or -1)
    if (
        payment.get("id") != payload.razorpay_payment_id
        or payment.get("order_id") != payload.razorpay_order_id
        or actual_amount not in expected_amounts
        or payment.get("currency") != "INR"
    ):
        raise HTTPException(status_code=400, detail="The Razorpay payment details do not match this order.")

    if payment.get("status") == "authorized" and not payment.get("captured"):
        payment = await asyncio.to_thread(
            _razorpay_request,
            "POST",
            f"payments/{quote(payload.razorpay_payment_id, safe='')}/capture",
            {"amount": amount_paise, "currency": "INR"},
        )
    expected_amounts = _payment_amount_candidates(order)
    actual_amount = int(payment.get("amount") or -1)
    if (
        payment.get("id") != payload.razorpay_payment_id
        or payment.get("order_id") != payload.razorpay_order_id
        or actual_amount not in expected_amounts
        or payment.get("currency") != "INR"
    ):
        raise HTTPException(status_code=502, detail="Razorpay returned inconsistent payment details.")
    if payment.get("status") != "captured" and not payment.get("captured"):
        raise HTTPException(status_code=409, detail="Payment is not captured yet. Please retry verification.")

    paid_at = datetime.now(timezone.utc).isoformat()
    result = await orders_collection.update_one(
        {"_id": order["_id"], "payment_status": "Unpaid"},
        {"$set": {
            "payment_status": "Paid",
            "payment_method": "Online",
            "payment_currency": "INR",
            "payment_amount_paise": int(payment.get("amount") or amount_paise),
            "paid_amount": (int(payment.get("amount") or amount_paise) / 100),
            "payment_exchange_rate": order.get("payment_exchange_rate", USD_TO_INR_RATE),
            "paid_at": paid_at,
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
        }},
    )
    if result.modified_count != 1:
        refreshed_order = await orders_collection.find_one({"_id": order["_id"]})
        if (
            refreshed_order
            and refreshed_order.get("payment_status") == "Paid"
            and refreshed_order.get("razorpay_payment_id") == payload.razorpay_payment_id
        ):
            await complete_paid_ready_order(refreshed_order)
            return StandardAPIResponse(
                success=True,
                message="This Razorpay payment was already recorded.",
                data={"order_id": order.get("order_id"), "payment_status": "Paid"},
            )
        raise HTTPException(status_code=409, detail="The order payment status changed. Refresh and try again.")

    await complete_paid_ready_order({
        **order,
        "payment_status": "Paid",
        "payment_method": "Online",
        "razorpay_payment_id": payload.razorpay_payment_id,
        "status": order.get("status", "Pending"),
    })

    return StandardAPIResponse(
        success=True,
        message="Razorpay payment verified and recorded.",
        data={
            "order_id": order.get("order_id"),
            "payment_status": "Paid",
            "razorpay_payment_id": payload.razorpay_payment_id,
        },
    )


@router.patch("/{order_identifier}/status", response_model=StandardAPIResponse)
@router.put("/{order_identifier}/status", response_model=StandardAPIResponse)
async def update_order_status(
    order_identifier: str,
    payload: OrderStatusUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Role-based Order Status Transition:
    Pending -> Accepted -> Preparing -> Ready -> Completed
    """
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {VALID_STATUSES}")

    query = _build_order_query(order_identifier)
    order = await orders_collection.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    result = await orders_collection.update_one(
        query,
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found.")
    updated_order = {**order, "status": payload.status}
    if payload.status in {"Ready", "Completed"}:
        updated_order = await complete_paid_ready_order(updated_order)

    # Create notification on status update
    try:
        now_ts = int(datetime.now(timezone.utc).timestamp())
        await notifications_collection.insert_one({
            "id": f"ntf_st_{now_ts}",
            "title": f"Order {order_identifier} updated",
            "message": f"Order status changed to {updated_order.get('status', payload.status)} by {current_user.get('name', 'Staff')}.",
            "type": "order",
            "target_role": "all",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_read": False
        })
    except Exception as err:
        print(f"[WARN] Status update notification error: {err}")

    return StandardAPIResponse(
        success=True,
        message=f"Order {order_identifier} status updated to '{updated_order.get('status', payload.status)}' successfully.",
        data={"order_id": order_identifier, "status": updated_order.get("status", payload.status)}
    )

@router.post("/{order_identifier}/pay", response_model=StandardAPIResponse)
@router.put("/{order_identifier}/pay", response_model=StandardAPIResponse)
async def process_order_payment(
    order_identifier: str,
    payload: Optional[PaymentUpdateRequest] = Body(default=None),
    current_user: dict = Depends(get_current_cashier_or_admin)
):
    """
    Cashier Payment Settlement:
    Marks order as Paid and marks status as Completed.
    If no JSON body is provided, defaults payment_status to 'Paid' and payment_method to 'Cash'.
    """
    if payload is None:
        payload = PaymentUpdateRequest(payment_status="Paid", payment_method="Cash")

    pay_status = payload.payment_status or "Paid"

    query = _build_order_query(order_identifier)
    order = await orders_collection.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    await orders_collection.update_one(
        query,
        {"$set": {
            "payment_status": pay_status,
            "payment_method": payload.payment_method or "Cash",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "status": "Completed"
        }}
    )

    # Reset Table Status to Available once payment completed
    t_num = order.get("table_number")
    if t_num:
        await tables_collection.update_one(
            {"table_number": t_num},
            {"$set": {"status": "Available"}, "$unset": {"reserved_by_name": "", "reserved_by_user_id": "", "reservation_id": "", "reserved_at": ""}}
        )
        try:
            from database import bookings_collection, customer_sessions_collection
            booking_id = order.get("booking_id")
            booking_query = {"id": booking_id} if booking_id else {"table_number": t_num, "status": "Active"}
            await bookings_collection.update_many(booking_query, {"$set": {"status": "Completed", "released_at": datetime.now(timezone.utc).isoformat()}})
            if booking_id:
                await customer_sessions_collection.update_many({"booking_id": booking_id, "status": {"$ne": "active"}}, {"$set": {"payment_completed_at": datetime.now(timezone.utc).isoformat()}})
        except Exception as err:
            print(f"[WARN] Booking close warning: {err}")

    return StandardAPIResponse(
        success=True,
        message=f"Payment of ${order.get('total_amount')} completed for {order_identifier}.",
        data={"order_id": order_identifier, "payment_status": pay_status}
    )

@router.post("/{order_identifier}/admin-cancel", response_model=StandardAPIResponse)
async def admin_cancel_order(
    order_identifier: str,
    payload: AdminCancelRequest,
    current_user: dict = Depends(get_current_cashier_or_admin)
):
    """
    Admin Cancel/Refund Order:
    Marks order as Cancelled. If is_refund is True, also marks payment as Refunded.
    """
    query = _build_order_query(order_identifier)
    order = await orders_collection.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.get("status") in ["Completed", "Cancelled"]:
        raise HTTPException(
            status_code=422,
            detail=f"Order is already '{order.get('status')}' and cannot be cancelled."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    update_fields = {
        "status": "Cancelled",
        "cancelled_at": now_iso,
        "updated_at": now_iso,
        "cancel_reason": payload.reason,
    }

    # If order was paid, mark as Refunded; if unpaid, clear payment status
    if payload.is_refund or order.get("payment_status") == "Paid":
        update_fields["payment_status"] = "Refunded"
    else:
        update_fields["payment_status"] = "Cancelled"

    await orders_collection.update_one(
        query,
        {"$set": update_fields}
    )

    # Reset table status to Available and clear reservation
    t_num = order.get("table_number")
    if t_num:
        await tables_collection.update_one(
            {"table_number": t_num},
            {"$set": {"status": "Available"}, "$unset": {"reserved_by_name": "", "reserved_by_user_id": "", "reservation_id": "", "reserved_at": ""}}
        )
        try:
            from database import bookings_collection, customer_sessions_collection
            booking_id = order.get("booking_id")
            booking_query = {"id": booking_id} if booking_id else {"table_number": t_num, "status": "Active"}
            await bookings_collection.update_many(booking_query, {"$set": {"status": "Cancelled", "released_at": now_iso}})
            if booking_id:
                await customer_sessions_collection.update_many({"booking_id": booking_id}, {"$set": {"status": "expired", "ended_at": now_iso, "end_reason": "Order cancelled"}})
        except Exception as err:
            print(f"[WARN] Booking/table cleanup warning: {err}")

    # Create notification
    try:
        now_ts = int(datetime.now(timezone.utc).timestamp())
        await notifications_collection.insert_one({
            "id": f"ntf_cancel_{now_ts}",
            "title": f"Order {order.get('order_id', order_identifier)} cancelled",
            "message": f"Order cancelled by {current_user.get('name', 'Admin')}. Reason: {payload.reason}",
            "type": "order",
            "target_role": "all",
            "created_at": now_iso,
            "is_read": False
        })
    except Exception as err:
        print(f"[WARN] Cancel notification error: {err}")

    return StandardAPIResponse(
        success=True,
        message=f"Order '{order.get('order_id', order_identifier)}' has been cancelled.",
        data={
            "order_id": order.get("order_id", order_identifier),
            "status": "Cancelled",
            "reason": payload.reason,
            "is_refund": payload.is_refund,
            "cancelled_by": current_user.get("name", "Admin"),
        }
    )
