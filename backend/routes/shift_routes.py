from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from database import shifts_collection, users_collection, notifications_collection
from models.schemas import (
    ShiftResponse, ShiftCreateRequest, ShiftUpdateRequest,
    ShiftAssignmentRequest, ShiftReassignRequest, StandardAPIResponse
)
from utils.security import get_current_user, get_current_admin

router = APIRouter(prefix="/api/shifts", tags=["Shift Management"])

def _build_shift_query(shift_id: str) -> dict:
    """Builds multi-field query supporting custom id, Mongo _id string & ObjectId."""
    conditions = [{"id": shift_id}, {"_id": shift_id}]
    
    clean_id = shift_id[4:] if shift_id.startswith("shf_") else shift_id
    if ObjectId.is_valid(clean_id):
        conditions.append({"_id": ObjectId(clean_id)})
        conditions.append({"id": clean_id})
    if ObjectId.is_valid(shift_id):
        conditions.append({"_id": ObjectId(shift_id)})
        
    return {"$or": conditions}

async def _resolve_assigned_user(user_identifier: Optional[str]) -> str:
    """Resolves User ObjectId, Custom User ID, Email, or Name to staff name."""
    if not user_identifier or user_identifier.strip().lower() == "unassigned":
        return "Unassigned"
    
    uid = user_identifier.strip()
    display_name = uid.split(" (", 1)[0].strip()
    conditions = [{"id": uid}, {"email": uid}, {"name": uid}, {"name": display_name}, {"_id": uid}]
    
    clean_id = uid[4:] if uid.startswith("usr_") else uid
    if ObjectId.is_valid(clean_id):
        conditions.append({"_id": ObjectId(clean_id)})
    if ObjectId.is_valid(uid):
        conditions.append({"_id": ObjectId(uid)})
        
    db_user = await users_collection.find_one({"$or": conditions})
    if db_user:
        if db_user.get("role") not in {"cashier", "chef"}:
            raise HTTPException(status_code=400, detail="Shifts can only be assigned to Cashier or Chef staff.")
        return db_user.get("name") or db_user.get("email") or uid
    return uid

async def _trigger_shift_notification(title: str, message: str, target_role: str = "all"):
    """Helper to emit shift-related notifications."""
    try:
        now = datetime.now(timezone.utc)
        await notifications_collection.insert_one({
            "id": f"ntf_shf_{int(now.timestamp() * 1000)}",
            "title": title,
            "message": message,
            "type": "shift",
            "target_role": target_role,
            "created_at": now.isoformat(),
            "is_read": False
        })
    except Exception as err:
        print(f"[WARN] Failed to trigger shift notification: {err}")

@router.get("", response_model=List[ShiftResponse])
async def list_shifts(status: Optional[str] = None):
    """
    List all staff shifts with optional status filter.
    """
    query = {}
    if status:
        query["status"] = status
    shifts = []
    try:
        cursor = shifts_collection.find(query).sort("created_at", -1)
        async for doc in cursor:
            shifts.append(ShiftResponse(
                id=doc.get("id", str(doc.get("_id"))),
                shift_name=doc.get("shift_name", "Morning Shift"),
                start_time=doc.get("start_time", "08:00 AM"),
                end_time=doc.get("end_time", "04:00 PM"),
                assigned_user=doc.get("assigned_user", "Unassigned"),
                status=doc.get("status", "Active"),
                created_at=doc.get("created_at", datetime.now(timezone.utc).isoformat())
            ))
    except Exception as err:
        print(f"[WARN] Error fetching shifts: {err}")
    return shifts

@router.get("/{shift_id}", response_model=ShiftResponse)
async def get_shift_by_id(shift_id: str):
    """
    Get single shift details by shift ID or ObjectId.
    """
    query = _build_shift_query(shift_id)
    doc = await shifts_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Shift not found.")
    return ShiftResponse(
        id=doc.get("id", str(doc.get("_id"))),
        shift_name=doc.get("shift_name", "Morning Shift"),
        start_time=doc.get("start_time", "08:00 AM"),
        end_time=doc.get("end_time", "04:00 PM"),
        assigned_user=doc.get("assigned_user", "Unassigned"),
        status=doc.get("status", "Active"),
        created_at=doc.get("created_at", datetime.now(timezone.utc).isoformat())
    )

@router.post("", response_model=ShiftResponse)
async def create_shift(payload: ShiftCreateRequest, current_admin: dict = Depends(get_current_admin)):
    """
    Shift Creation API: Create shift with name, start/end timing, assignment (supports User ObjectId), and status.
    """
    resolved_user = await _resolve_assigned_user(payload.assigned_user)
    shift_id = f"shf_{int(datetime.now(timezone.utc).timestamp())}"
    shift_doc = {
        "id": shift_id,
        "shift_name": payload.shift_name,
        "start_time": payload.start_time,
        "end_time": payload.end_time,
        "assigned_user": resolved_user,
        "status": payload.status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await shifts_collection.insert_one(shift_doc)

    await _trigger_shift_notification(
        title=f"New Shift Created: {payload.shift_name}",
        message=f"{payload.shift_name} ({payload.start_time} - {payload.end_time}) assigned to {resolved_user}.",
        target_role="all"
    )

    return ShiftResponse(**shift_doc)

@router.patch("/{shift_id}", response_model=StandardAPIResponse)
@router.put("/{shift_id}", response_model=StandardAPIResponse)
async def update_shift_details(shift_id: str, payload: ShiftUpdateRequest, current_admin: dict = Depends(get_current_admin)):
    """
    Shift Timing & Details Update API: Update shift name, start_time, end_time, assigned_user (User ObjectId), or status.
    """
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    if "assigned_user" in update_data:
        update_data["assigned_user"] = await _resolve_assigned_user(update_data["assigned_user"])

    query = _build_shift_query(shift_id)
    result = await shifts_collection.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found.")

    await _trigger_shift_notification(
        title="Shift Schedule Updated",
        message=f"Shift {shift_id} details updated by admin.",
        target_role="all"
    )

    return StandardAPIResponse(success=True, message="Shift updated successfully.", data=update_data)

@router.post("/reassign", response_model=StandardAPIResponse)
async def reassign_staff_shift_body(payload: ShiftReassignRequest, current_admin: dict = Depends(get_current_admin)):
    """
    Reassign Staff to Shift API (Body Payload): Reassign shift using JSON body with shift_id and assigned_user.
    """
    resolved_user = await _resolve_assigned_user(payload.assigned_user)
    query = _build_shift_query(payload.shift_id)
    result = await shifts_collection.update_one(query, {"$set": {"assigned_user": resolved_user}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Shift '{payload.shift_id}' not found.")

    await _trigger_shift_notification(
        title="Shift Reassigned Alert",
        message=f"Shift {payload.shift_id} reassigned to '{resolved_user}'.",
        target_role="all"
    )

    return StandardAPIResponse(success=True, message=f"Shift '{payload.shift_id}' reassigned to '{resolved_user}' successfully.", data={"shift_id": payload.shift_id, "assigned_user": resolved_user})

@router.patch("/{shift_id}/assign", response_model=StandardAPIResponse)
@router.put("/{shift_id}/assign", response_model=StandardAPIResponse)
@router.patch("/{shift_id}/reassign", response_model=StandardAPIResponse)
@router.put("/{shift_id}/reassign", response_model=StandardAPIResponse)
@router.post("/{shift_id}/reassign", response_model=StandardAPIResponse)
async def assign_staff_to_shift(shift_id: str, payload: ShiftAssignmentRequest, current_admin: dict = Depends(get_current_admin)):
    """
    Shift Staff Assignment & Reassignment API: Assign/Reassign shift using User ObjectId, Custom User ID, Email, or Name.
    """
    resolved_user = await _resolve_assigned_user(payload.assigned_user)
    query = _build_shift_query(shift_id)
    result = await shifts_collection.update_one(query, {"$set": {"assigned_user": resolved_user}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found.")

    await _trigger_shift_notification(
        title="Shift Reassigned Alert",
        message=f"Shift {shift_id} reassigned to '{resolved_user}'.",
        target_role="all"
    )

    return StandardAPIResponse(success=True, message=f"Shift assigned to '{resolved_user}' successfully.", data={"shift_id": shift_id, "assigned_user": resolved_user})

@router.patch("/{shift_id}/status", response_model=StandardAPIResponse)
@router.put("/{shift_id}/status", response_model=StandardAPIResponse)
async def update_shift_status(shift_id: str, status: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    """
    Shift Status API: Update shift status (Active, Closed).
    """
    new_status = status or "Active"
    query = _build_shift_query(shift_id)
    result = await shifts_collection.update_one(query, {"$set": {"status": new_status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found.")

    await _trigger_shift_notification(
        title=f"Shift Status Changed",
        message=f"Shift {shift_id} status changed to '{new_status}'.",
        target_role="all"
    )

    return StandardAPIResponse(success=True, message=f"Shift status updated to '{new_status}'.")

@router.delete("/{shift_id}", response_model=StandardAPIResponse)
async def delete_shift(shift_id: str, current_admin: dict = Depends(get_current_admin)):
    """
    Delete a shift schedule.
    """
    query = _build_shift_query(shift_id)
    result = await shifts_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found.")

    await _trigger_shift_notification(
        title="Shift Schedule Cancelled",
        message=f"Shift {shift_id} was removed from the roster.",
        target_role="all"
    )

    return StandardAPIResponse(success=True, message="Shift deleted successfully.")




