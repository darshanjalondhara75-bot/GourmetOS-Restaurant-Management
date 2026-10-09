from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from database import notifications_collection
from models.schemas import (
    NotificationCreateRequest, NotificationResponse, UnreadCountResponse, StandardAPIResponse
)
from utils.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

def _build_notification_query(notification_id: str) -> dict:
    """Builds multi-field query supporting custom string ID, Mongo _id string & ObjectId."""
    conditions = [{"id": notification_id}, {"_id": notification_id}]
    clean_id = notification_id[4:] if notification_id.startswith("ntf_") else notification_id
    if ObjectId.is_valid(clean_id):
        conditions.append({"_id": ObjectId(clean_id)})
        conditions.append({"id": clean_id})
    if ObjectId.is_valid(notification_id):
        conditions.append({"_id": ObjectId(notification_id)})
    return {"$or": conditions}

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    type: Optional[str] = Query(None, description="Filter by type: order, shift, kitchen, alert"),
    target_role: Optional[str] = Query(None, description="Filter by recipient role: all, admin, cashier, chef"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    limit: int = Query(50, ge=1, le=200, description="Max notifications to fetch"),
    current_user: dict = Depends(get_current_user)
):
    """
    List active notifications with optional filtering by type, role, read status, and limit.
    """
    query = {}
    if type:
        query["type"] = type
    if target_role:
        query["target_role"] = {"$in": [target_role, "all"]}
    elif current_user and current_user.get("role"):
        user_role = current_user.get("role")
        query["target_role"] = {"$in": [user_role, "all"]}
        
    if is_read is not None:
        query["is_read"] = is_read

    notifications = []
    try:
        cursor = notifications_collection.find(query).sort("created_at", -1).limit(limit)
        async for doc in cursor:
            notifications.append(NotificationResponse(
                id=doc.get("id", str(doc.get("_id"))),
                title=doc.get("title", "Notification"),
                message=doc.get("message", ""),
                type=doc.get("type", "order"),
                target_role=doc.get("target_role", "all"),
                created_at=doc.get("created_at", datetime.now(timezone.utc).isoformat()),
                is_read=doc.get("is_read", False)
            ))
    except Exception as err:
        print(f"[WARN] Error fetching notifications: {err}")
    return notifications

@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """
    Get count of unread notifications for badge indicators.
    """
    query = {"is_read": False}
    if current_user and current_user.get("role"):
        user_role = current_user.get("role")
        query["target_role"] = {"$in": [user_role, "all"]}
    
    count = await notifications_collection.count_documents(query)
    return UnreadCountResponse(unread_count=count)

@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification_by_id(notification_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get single notification details by notification ID.
    """
    query = _build_notification_query(notification_id)
    doc = await notifications_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return NotificationResponse(
        id=doc.get("id", str(doc.get("_id"))),
        title=doc.get("title", "Notification"),
        message=doc.get("message", ""),
        type=doc.get("type", "order"),
        target_role=doc.get("target_role", "all"),
        created_at=doc.get("created_at", datetime.now(timezone.utc).isoformat()),
        is_read=doc.get("is_read", False)
    )

@router.post("", response_model=NotificationResponse)
async def create_notification(payload: NotificationCreateRequest, current_user: dict = Depends(get_current_user)):
    """
    Create custom or system notification (Order, Shift, Kitchen, Alert).
    """
    now = datetime.now(timezone.utc)
    ntf_id = f"ntf_{int(now.timestamp() * 1000)}"
    doc = {
        "id": ntf_id,
        "title": payload.title,
        "message": payload.message,
        "type": payload.type or "order",
        "target_role": payload.target_role or "all",
        "created_at": now.isoformat(),
        "is_read": False
    }
    await notifications_collection.insert_one(doc)
    return NotificationResponse(**doc)

@router.post("/order", response_model=NotificationResponse)
async def create_order_notification(title: str, message: str, target_role: str = "all", current_user: dict = Depends(get_current_user)):
    """
    Helper API to generate an Order-related notification.
    """
    req = NotificationCreateRequest(title=title, message=message, type="order", target_role=target_role)
    return await create_notification(req, current_user)

@router.post("/shift", response_model=NotificationResponse)
async def create_shift_notification(title: str, message: str, target_role: str = "all", current_user: dict = Depends(get_current_user)):
    """
    Helper API to generate a Shift-related notification.
    """
    req = NotificationCreateRequest(title=title, message=message, type="shift", target_role=target_role)
    return await create_notification(req, current_user)

@router.patch("/{notification_id}/read", response_model=StandardAPIResponse)
@router.put("/{notification_id}/read", response_model=StandardAPIResponse)
@router.post("/{notification_id}/read", response_model=StandardAPIResponse)
async def mark_single_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """
    Mark a single notification as read.
    """
    query = _build_notification_query(notification_id)
    result = await notifications_collection.update_one(query, {"$set": {"is_read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return StandardAPIResponse(success=True, message=f"Notification '{notification_id}' marked as read.")

@router.post("/read-all", response_model=StandardAPIResponse)
@router.put("/read-all", response_model=StandardAPIResponse)
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """
    Mark all notifications as read.
    """
    query = {}
    if current_user and current_user.get("role"):
        user_role = current_user.get("role")
        query["target_role"] = {"$in": [user_role, "all"]}
    await notifications_collection.update_many(query, {"$set": {"is_read": True}})
    return StandardAPIResponse(success=True, message="Notifications marked as read.")

@router.delete("/clear-read", response_model=StandardAPIResponse)
async def clear_read_notifications(current_user: dict = Depends(get_current_user)):
    """
    Clear/delete all read notifications.
    """
    result = await notifications_collection.delete_many({"is_read": True})
    return StandardAPIResponse(success=True, message=f"Deleted {result.deleted_count} read notifications.")

@router.delete("/{notification_id}", response_model=StandardAPIResponse)
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a single notification by ID.
    """
    query = _build_notification_query(notification_id)
    result = await notifications_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return StandardAPIResponse(success=True, message="Notification deleted successfully.")

