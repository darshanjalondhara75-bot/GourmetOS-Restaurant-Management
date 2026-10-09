from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
import os
from urllib.parse import quote
from bson import ObjectId
from database import tables_collection
from models.schemas import TableResponse, TableCreateRequest, TableUpdateRequest, StandardAPIResponse
from utils.security import get_current_user, get_current_admin

router = APIRouter(prefix="/api/tables", tags=["Table Management"])

def _normalize_table_number(value: str) -> str:
    """Keep table identifiers numeric and remove leading zeroes or prefixes."""
    digits = "".join(character for character in value.strip() if character.isdigit())
    if not digits:
        raise HTTPException(status_code=400, detail="Table number must contain a number.")
    return str(int(digits))

def _build_table_query(identifier: str) -> dict:
    """Multi-field table lookup supporting id ('tbl_1'), table_number ('1', 'T1'), string _id & ObjectId."""
    clean_num = identifier.replace("tbl_", "").replace("table_", "").replace("T", "").strip()
    conditions = [
        {"id": identifier},
        {"table_number": identifier},
        {"table_number": clean_num},
        {"_id": identifier}
    ]
    if ObjectId.is_valid(identifier):
        conditions.append({"_id": ObjectId(identifier)})
    return {"$or": conditions}

DEFAULT_TABLES = [
    {"id": "tbl_1", "table_number": "1", "capacity": 2},
    {"id": "tbl_2", "table_number": "2", "capacity": 4},
    {"id": "tbl_3", "table_number": "3", "capacity": 4},
    {"id": "tbl_4", "table_number": "4", "capacity": 6},
    {"id": "tbl_5", "table_number": "5", "capacity": 2},
    {"id": "tbl_6", "table_number": "6", "capacity": 8},
]

async def _ensure_default_tables():
    """Backfill tables for existing installations whose tables collection is empty."""
    if await tables_collection.count_documents({}) > 0:
        return
    now_defaults = [
        {**table, "status": "Available", "qr_code_url": f"/customer/menu?tableId={table['table_number']}"}
        for table in DEFAULT_TABLES
    ]
    try:
        await tables_collection.insert_many(now_defaults, ordered=False)
    except Exception as err:
        print(f"[WARN] Default table backfill skipped: {err}")

@router.get("", response_model=List[TableResponse])
async def list_tables():
    """List all restaurant dining tables. If an older DB has no tables, seed a safe default set."""
    await _ensure_default_tables()
    tables = []
    cursor = tables_collection.find().sort("table_number", 1)
    async for doc in cursor:
        t_num = doc.get("table_number", "1")
        tables.append(TableResponse(
            id=doc.get("id", str(doc.get("_id"))),
            table_number=t_num,
            capacity=doc.get("capacity", 4),
            status=doc.get("status", "Available"),
            qr_code_url=doc.get("qr_code_url", f"/customer/menu?tableId={t_num}"),
            reserved_by_name=doc.get("reserved_by_name"),
            reservation_id=doc.get("reservation_id"),
            reserved_at=doc.get("reserved_at"),
        ))
    return tables

@router.post("", response_model=TableResponse)
async def create_table(payload: TableCreateRequest, current_admin: dict = Depends(get_current_admin)):
    """
    Create a new dining table and map its customer menu QR code URL.
    """
    normalized_number = _normalize_table_number(payload.table_number)
    existing = await tables_collection.find_one({"table_number": normalized_number})
    if existing:
        raise HTTPException(status_code=400, detail="Table number already exists.")
    
    t_id = f"tbl_{normalized_number}"
    qr_url = f"/customer/menu?tableId={normalized_number}"
    table_doc = {
        "id": t_id,
        "table_number": normalized_number,
        "capacity": payload.capacity,
        "status": payload.status,
        "qr_code_url": qr_url
    }
    await tables_collection.insert_one(table_doc)
    return TableResponse(**table_doc)

@router.patch("/{table_number}/status", response_model=StandardAPIResponse)
@router.put("/{table_number}/status", response_model=StandardAPIResponse)
async def update_table_status(table_number: str, payload: TableUpdateRequest, current_user: dict = Depends(get_current_user)):
    """
    Update table status (Available, Occupied, Reserved, Cleaning).
    """
    update_data = {}
    unset_data = {}
    if payload.status:
        update_data["status"] = payload.status
        if payload.status == "Available":
            unset_data.update({"reserved_by_name": "", "reserved_by_user_id": "", "reservation_id": "", "reserved_at": ""})
    if payload.capacity:
        update_data["capacity"] = payload.capacity

    update_doc = {"$set": update_data}
    if unset_data:
        update_doc["$unset"] = unset_data
    result = await tables_collection.update_one(
        {"table_number": table_number},
        update_doc
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Table not found.")
    
    return StandardAPIResponse(success=True, message=f"Table {table_number} status updated to {payload.status}.")

@router.get("/validate/{table_identifier}")
async def validate_table(table_identifier: str):
    """
    Table ID Validation API:
    - Validates if a table exists by ID ('tbl_1'), Table Number ('1'), or ObjectId.
    - Returns table validity, status, capacity, and QR code URL for ordering.
    """
    query = _build_table_query(table_identifier)
    doc = await tables_collection.find_one(query)
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"Invalid Table ID: '{table_identifier}'. Table does not exist in system."
        )
    t_num = doc.get("table_number", table_identifier)
    return {
        "valid": True,
        "message": f"Table {t_num} is valid.",
        "table": TableResponse(
            id=doc.get("id", str(doc.get("_id"))),
            table_number=t_num,
            capacity=doc.get("capacity", 4),
            status=doc.get("status", "Available"),
            qr_code_url=doc.get("qr_code_url", f"/customer/menu?tableId={t_num}"),
            reserved_by_name=doc.get("reserved_by_name"),
            reservation_id=doc.get("reservation_id"),
            reserved_at=doc.get("reserved_at"),
        )
    }

@router.get("/{table_number}", response_model=TableResponse)
async def get_table_by_number(table_number: str):
    """
    Get dining table details by Table Number, ID ('tbl_1'), or ObjectId.
    """
    query = _build_table_query(table_number)
    doc = await tables_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Table not found.")
    t_num = doc.get("table_number", table_number)
    return TableResponse(
        id=doc.get("id", str(doc.get("_id"))),
        table_number=t_num,
        capacity=doc.get("capacity", 4),
        status=doc.get("status", "Available"),
        qr_code_url=doc.get("qr_code_url", f"/customer/menu?tableId={t_num}"),
        reserved_by_name=doc.get("reserved_by_name"),
        reservation_id=doc.get("reservation_id"),
        reserved_at=doc.get("reserved_at"),
    )

def _public_app_base(request: Request) -> str:
    configured = (os.getenv("PUBLIC_APP_URL") or os.getenv("NEXT_PUBLIC_APP_URL") or "").strip().rstrip("/")
    if configured:
        return configured
    for origin in (os.getenv("CORS_ORIGINS") or "").split(","):
        origin = origin.strip().rstrip("/")
        if origin and origin != "*" and ":8000" not in origin:
            return origin
    request_base = str(request.base_url).rstrip("/")
    if request_base.endswith(":8000"):
        return request_base[:-5] + ":3000"
    return request_base


@router.get("/{table_number}/qr")
async def get_table_qr_mapping(table_number: str, request: Request, token: Optional[str] = None):
    """
    Get Table QR Code Mapping, target Customer Menu URL, and printable QR Image link.

    The QR must never point to localhost when the app is deployed. A public app URL can
    be supplied via PUBLIC_APP_URL; otherwise the current request host is used.
    """
    doc = await tables_collection.find_one({"table_number": table_number})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Table '{table_number}' not found.")

    t_num = doc.get("table_number", table_number)
    query = f"tableId={quote(str(t_num), safe='')}"
    if token:
        query += f"&token={quote(token, safe='')}"
    relative_url = f"/customer/menu?{query}"
    public_base = _public_app_base(request)
    full_target_url = f"{public_base}{relative_url}"
    qr_image_url = f"https://quickchart.io/qr?text={quote(full_target_url, safe='')}&size=320&margin=2"

    return {
        "table_number": t_num,
        "capacity": doc.get("capacity", 4),
        "status": doc.get("status", "Available"),
        "qr_code_url": relative_url,
        "full_target_url": full_target_url,
        "qr_image_url": qr_image_url
    }

@router.delete("/{table_identifier}", response_model=StandardAPIResponse)
async def delete_table(table_identifier: str, current_admin: dict = Depends(get_current_admin)):
    """
    Delete a dining table by Table Number ('1'), Table ID ('tbl_1'), or MongoDB ObjectId.
    Requires Admin authorization.
    """
    query = _build_table_query(table_identifier)
    result = await tables_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Table '{table_identifier}' not found.")
    return StandardAPIResponse(success=True, message=f"Table '{table_identifier}' deleted successfully.")

