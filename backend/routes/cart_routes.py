from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from database import carts_collection, menu_items_collection, orders_collection, notifications_collection, tables_collection
from config import USD_TO_INR_RATE, usd_to_inr_paise
from models.schemas import (
    AddToCartRequest, UpdateCartItemRequest, CartResponse, CartItem,
    OrderResponse, StandardAPIResponse, CheckoutCartRequest
)
from bson import ObjectId
from utils.security import require_current_user
from services.customer_session import validate_customer_session, consume_customer_session

router = APIRouter(prefix="/api/cart", tags=["Cart Management"])

def _calculate_cart_totals(items: list) -> tuple[float, int]:
    total_amount = sum(float(item.get("price", 0.0)) * int(item.get("quantity", 1)) for item in items)
    item_count = sum(int(item.get("quantity", 1)) for item in items)
    return round(total_amount, 2), item_count

async def _get_or_create_item_details(item_id: str):
    query = {"$or": [{"id": item_id}, {"_id": item_id}]}
    if ObjectId.is_valid(item_id):
        query["$or"].append({"_id": ObjectId(item_id)})
    item = await menu_items_collection.find_one(query)
    if not item:
        raise HTTPException(status_code=404, detail=f"Menu item '{item_id}' not found.")
    return item

async def _require_session(table_number: str, session_token: str, current_user: dict):
    if current_user.get("role") != "user":
        raise HTTPException(status_code=403, detail="Customer/User access is required for this dining session.")
    return await validate_customer_session(session_token, user_id=current_user.get("sub"), table_number=table_number)

@router.get("/{table_number}", response_model=CartResponse)
async def get_cart(table_number: str, session_token: str, current_user: dict = Depends(require_current_user)):
    await _require_session(table_number, session_token, current_user)
    cart = await carts_collection.find_one({"table_number": table_number})
    if not cart:
        return CartResponse(table_number=table_number, items=[], total_amount=0.0, item_count=0, updated_at=datetime.now(timezone.utc).isoformat())
    items = cart.get("items", [])
    total_amount, item_count = _calculate_cart_totals(items)
    return CartResponse(table_number=table_number, items=[CartItem(**item) for item in items], total_amount=total_amount, item_count=item_count, updated_at=cart.get("updated_at", datetime.now(timezone.utc).isoformat()))

@router.post("/{table_number}/items", response_model=CartResponse)
async def add_to_cart(table_number: str, payload: AddToCartRequest, current_user: dict = Depends(require_current_user)):
    await _require_session(table_number, payload.session_token or "", current_user)
    menu_item = await _get_or_create_item_details(payload.item_id)
    if not menu_item.get("is_available", True):
        raise HTTPException(status_code=400, detail=f"Item '{menu_item.get('name')}' is currently sold out.")
    cart = await carts_collection.find_one({"table_number": table_number})
    items = cart.get("items", []) if cart else []
    item_id_str = str(menu_item.get("id", str(menu_item.get("_id"))))
    existing_idx = next((i for i, item in enumerate(items) if item.get("item_id") == item_id_str), None)
    qty_to_add = payload.quantity if payload.quantity and payload.quantity > 0 else 1
    if existing_idx is not None:
        items[existing_idx]["quantity"] += qty_to_add
        if payload.notes: items[existing_idx]["notes"] = payload.notes
    else:
        items.append({"item_id": item_id_str, "name": menu_item.get("name", "Unknown Item"), "quantity": qty_to_add, "price": float(menu_item.get("price", 0.0)), "notes": payload.notes or "", "image_url": menu_item.get("image_url", "")})
    total_amount, item_count = _calculate_cart_totals(items)
    now_str = datetime.now(timezone.utc).isoformat()
    await carts_collection.update_one({"table_number": table_number}, {"$set": {"table_number": table_number, "items": items, "total_amount": total_amount, "item_count": item_count, "updated_at": now_str}}, upsert=True)
    return CartResponse(table_number=table_number, items=[CartItem(**item) for item in items], total_amount=total_amount, item_count=item_count, updated_at=now_str)

async def _find_cart_item_index(items: list, item_id: str) -> int | None:
    for i, item in enumerate(items):
        if item_id in (str(item.get("item_id", "")), str(item.get("_id", ""))): return i
    query = {"$or": [{"id": item_id}, {"_id": item_id}]}
    if ObjectId.is_valid(item_id): query["$or"].append({"_id": ObjectId(item_id)})
    menu_item = await menu_items_collection.find_one(query)
    if menu_item:
        matched_ids = {str(menu_item.get("id", "")), str(menu_item.get("_id", ""))}
        for i, item in enumerate(items):
            if str(item.get("item_id", "")) in matched_ids: return i
    return None

@router.put("/{table_number}/items/{item_id}")
@router.patch("/{table_number}/items/{item_id}")
async def update_cart_item(table_number: str, item_id: str, payload: UpdateCartItemRequest, current_user: dict = Depends(require_current_user)):
    await _require_session(table_number, payload.session_token or "", current_user)
    cart = await carts_collection.find_one({"table_number": table_number})
    items = cart.get("items", []) if cart else []
    existing_idx = await _find_cart_item_index(items, item_id)
    if existing_idx is None:
        return CartResponse(table_number=table_number, items=[CartItem(**item) for item in items], total_amount=_calculate_cart_totals(items)[0], item_count=_calculate_cart_totals(items)[1], updated_at=cart.get("updated_at", datetime.now(timezone.utc).isoformat()) if cart else datetime.now(timezone.utc).isoformat())
    if payload.quantity is not None:
        if payload.quantity <= 0: items.pop(existing_idx)
        else: items[existing_idx]["quantity"] = payload.quantity
    if payload.notes is not None and existing_idx < len(items): items[existing_idx]["notes"] = payload.notes
    total_amount, item_count = _calculate_cart_totals(items); now_str = datetime.now(timezone.utc).isoformat()
    await carts_collection.update_one({"table_number": table_number}, {"$set": {"items": items, "total_amount": total_amount, "item_count": item_count, "updated_at": now_str}}, upsert=True)
    return CartResponse(table_number=table_number, items=[CartItem(**item) for item in items], total_amount=total_amount, item_count=item_count, updated_at=now_str)

@router.delete("/{table_number}/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(table_number: str, item_id: str, session_token: str, current_user: dict = Depends(require_current_user)):
    await _require_session(table_number, session_token, current_user)
    cart = await carts_collection.find_one({"table_number": table_number}); items = cart.get("items", []) if cart else []
    idx = await _find_cart_item_index(items, item_id)
    if idx is not None: items.pop(idx)
    total_amount, item_count = _calculate_cart_totals(items); now_str = datetime.now(timezone.utc).isoformat()
    await carts_collection.update_one({"table_number": table_number}, {"$set": {"items": items, "total_amount": total_amount, "item_count": item_count, "updated_at": now_str}}, upsert=True)
    return CartResponse(table_number=table_number, items=[CartItem(**item) for item in items], total_amount=total_amount, item_count=item_count, updated_at=now_str)

@router.delete("/{table_number}", response_model=StandardAPIResponse)
async def clear_cart(table_number: str, session_token: str, current_user: dict = Depends(require_current_user)):
    await _require_session(table_number, session_token, current_user)
    await carts_collection.delete_one({"table_number": table_number})
    return StandardAPIResponse(success=True, message=f"Table {table_number} cart cleared successfully.")

@router.post("/{table_number}/checkout", response_model=OrderResponse)
async def checkout_cart(table_number: str, payload: CheckoutCartRequest, current_user: dict = Depends(require_current_user)):
    session = await _require_session(table_number, payload.session_token, current_user)
    cart = await carts_collection.find_one({"table_number": table_number})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cannot checkout an empty cart.")
    cart_items = cart.get("items", []); total_amount, _ = _calculate_cart_totals(cart_items)
    now = datetime.now(timezone.utc); ms_ts = int(now.timestamp() * 1000); order_id = f"ORD-{ms_ts}"; db_id = f"ord_{ms_ts}"; created_at_str = now.isoformat()
    await consume_customer_session(payload.session_token, user_id=current_user.get("sub"), table_number=table_number, order_id=order_id)
    order_doc = {
        "id": db_id, "order_id": order_id, "table_number": table_number,
        "customer_name": session.get("customer_name") or payload.customer_name or f"Table #{table_number} Guest",
        "customer_user_id": current_user.get("sub"), "booking_id": session.get("booking_id"), "items": cart_items,
        "total_amount": total_amount, "status": "Pending", "payment_status": "Unpaid",
        "payment_method": payload.payment_method,
        "payment_currency": "INR",
        "payment_amount_paise": usd_to_inr_paise(total_amount),
        "payment_exchange_rate": USD_TO_INR_RATE,
        "special_instructions": payload.special_instructions or "", "created_at": created_at_str,
        "order_token": session.get("display_token"),
    }
    try:
        await orders_collection.insert_one(order_doc)
    except Exception:
        from database import customer_sessions_collection
        await customer_sessions_collection.update_one({"order_id": order_id}, {"$set": {"status": "active"}, "$unset": {"used_at": "", "order_id": "", "ended_at": "", "end_reason": ""}})
        raise HTTPException(status_code=500, detail="Order could not be created. Please try again.")
    await tables_collection.update_one({"table_number": table_number}, {"$set": {"status": "Occupied"}})
    display_token = session.get("display_token") or ""
    await notifications_collection.insert_one({
        "id": f"ntf_{ms_ts}",
        "title": f"New Order {order_id}",
        "message": f"Table {table_number} placed order {order_id} with token {display_token or 'N/A'}.",
        "type": "order",
        "target_role": "all",
        "created_at": created_at_str,
        "is_read": False,
    })
    await carts_collection.delete_one({"table_number": table_number})
    return OrderResponse(**order_doc)
