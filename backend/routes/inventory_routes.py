import re
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from database import (
    inventory_items_collection, inventory_purchases_collection, inventory_consumption_collection,
    inventory_wastage_collection, purchase_requirements_collection, inventory_audit_collection,
)
from models.schemas import (
    InventoryItemResponse, InventoryItemUpdateRequest, PurchaseCreateRequest, ConsumptionCreateRequest,
    WastageCreateRequest, PurchaseRequirementCreateRequest, PurchaseRequirementStatusRequest,
    InventoryAdjustmentRequest, StandardAPIResponse,
)
from utils.security import get_current_admin_or_chef, get_current_admin

router = APIRouter(prefix="/api/inventory", tags=["Inventory & Stock"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _status(current: float, minimum: float) -> str:
    if current <= 0:
        return "Out of Stock"
    if minimum > 0 and current < minimum:
        return "Low Stock"
    return "In Stock"

def _item_response(doc: dict) -> InventoryItemResponse:
    current = float(doc.get("current_stock", 0))
    minimum = float(doc.get("minimum_level", 0))
    return InventoryItemResponse(
        id=doc.get("id") or str(doc.get("_id")), name=doc.get("name", ""), category=doc.get("category", "General"),
        unit=doc.get("unit", "piece"), opening_stock=float(doc.get("opening_stock", 0)), current_stock=current,
        minimum_level=minimum, status=_status(current, minimum), last_purchase_price=float(doc.get("last_purchase_price", 0)),
        updated_at=doc.get("updated_at", "")
    )

async def _find_item(item_id: str = "", item_name: str = "") -> Optional[dict]:
    item_id = (item_id or "").strip()
    item_name = (item_name or "").strip()
    clauses = []
    if item_id:
        clauses.extend([
            {"id": item_id},
            {"name_key": item_id.lower()},
            {"name": item_id},
            {"_id": item_id},
        ])
        if ObjectId.is_valid(item_id):
            clauses.append({"_id": ObjectId(item_id)})
    if item_name:
        clauses.extend([
            {"name_key": item_name.lower()},
            {"name": {"$regex": f"^{re.escape(item_name)}$", "$options": "i"}},
        ])
    if not clauses:
        return None
    item = await inventory_items_collection.find_one({"$or": clauses})
    if item and not item.get("id"):
        new_id = f"inv_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
        await inventory_items_collection.update_one({"_id": item["_id"]}, {"$set": {"id": new_id}})
        item["id"] = new_id
    return item

async def _get_or_create_item(name: str, category: str, unit: str, minimum_level: float = 0) -> dict:
    name = name.strip()
    query = {"name_key": name.lower()}
    item = await inventory_items_collection.find_one(query)
    if item:
        updates = {}
        if not item.get("id"):
            updates["id"] = f"inv_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
        if category and not item.get("category"): updates["category"] = category
        if unit and not item.get("unit"): updates["unit"] = unit
        if minimum_level is not None and "minimum_level" not in item: updates["minimum_level"] = minimum_level
        if updates:
            await inventory_items_collection.update_one({"_id": item["_id"]}, {"$set": updates})
            item.update(updates)
        return item
    doc = {
        "id": f"inv_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}", "name_key": name.lower(), "name": name,
        "category": category or "General", "unit": unit or "piece", "opening_stock": 0.0, "current_stock": 0.0,
        "minimum_level": float(minimum_level or 0), "last_purchase_price": 0.0, "updated_at": _now()
    }
    await inventory_items_collection.insert_one(doc)
    return doc

async def _audit(action: str, item: dict, *, quantity: float = 0, amount: float = 0, actor: str, reason: str = "", reference: str = "", supplier: str = "", category: str = "", status: str = ""):
    doc = {
        "id": f"audit_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}", "timestamp": _now(), "action": action,
        "item_id": item.get("id", str(item.get("_id"))), "item": item.get("name", ""), "quantity": float(quantity),
        "amount": round(float(amount), 2), "performed_by": actor, "reason": reason, "reference": reference,
        "supplier": supplier or item.get("supplier", ""), "category": category or item.get("category", "General"), "status": status,
    }
    await inventory_audit_collection.insert_one(doc)

@router.get("/items", response_model=List[InventoryItemResponse])
async def list_inventory_items(search: Optional[str] = None, category: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_admin_or_chef)):
    query = {}
    if search:
        query["name"] = {"$regex": search.strip(), "$options": "i"}
    if category and category != "All": query["category"] = category
    items = []
    cursor = inventory_items_collection.find(query).sort("name", 1)
    async for doc in cursor:
        response = _item_response(doc)
        if status and status != "All" and response.status != status: continue
        items.append(response)
    return items

@router.patch("/items/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(item_id: str, payload: InventoryItemUpdateRequest, current_user: dict = Depends(get_current_admin_or_chef)):
    doc = await _find_item(item_id)
    if not doc: raise HTTPException(status_code=404, detail="Inventory item not found.")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "opening_stock" in updates:
        old_opening = float(doc.get("opening_stock", 0))
        delta = float(updates["opening_stock"]) - old_opening
        if delta:
            await inventory_items_collection.update_one({"_id": doc["_id"]}, {"$inc": {"current_stock": delta}})
            await _audit("STOCK ADJUSTMENT", doc, quantity=delta, actor=current_user.get("name", "Staff"), reason="Opening stock correction", reference=item_id)
    updates["updated_at"] = _now()
    await inventory_items_collection.update_one({"_id": doc["_id"]}, {"$set": updates})
    refreshed = await inventory_items_collection.find_one({"_id": doc["_id"]})
    return _item_response(refreshed)

@router.post("/purchases")
async def add_purchase(payload: PurchaseCreateRequest, current_user: dict = Depends(get_current_admin_or_chef)):
    if payload.quantity <= 0 or payload.unit_price < 0: raise HTTPException(status_code=400, detail="Quantity must be positive and unit price cannot be negative.")
    item = await _get_or_create_item(payload.item_name, payload.category, payload.unit, payload.minimum_level or 0)
    total_cost = round(payload.quantity * payload.unit_price, 2)
    now = _now()
    doc = {**payload.model_dump(), "id": f"pur_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}", "item_id": item.get("id"), "total_cost": total_cost, "created_at": now, "performed_by": current_user.get("name", "Chef")}
    await inventory_purchases_collection.insert_one(doc)
    await inventory_items_collection.update_one({"_id": item["_id"]}, {"$inc": {"current_stock": payload.quantity}, "$set": {"last_purchase_price": payload.unit_price, "updated_at": now}})
    await _audit("PURCHASE", item, quantity=payload.quantity, amount=total_cost, actor=current_user.get("name", "Chef"), reason=payload.notes or "", reference=doc["id"], supplier=payload.supplier, category=item.get("category", payload.category))
    return StandardAPIResponse(success=True, message="Purchase added and stock increased successfully.", data={"purchase_id": doc["id"], "total_cost": total_cost})

@router.get("/purchases")
async def list_purchases(limit: int = 100, current_user: dict = Depends(get_current_admin_or_chef)):
    rows = []
    cursor = inventory_purchases_collection.find().sort("created_at", -1).limit(limit)
    async for d in cursor: rows.append({k: v for k, v in d.items() if k != "_id"})
    return rows

@router.post("/consumption")
async def add_consumption(payload: ConsumptionCreateRequest, current_user: dict = Depends(get_current_admin_or_chef)):
    item = await _find_item(payload.item_id, payload.item_name or "")
    if not item: raise HTTPException(status_code=404, detail="Inventory item not found.")
    if payload.quantity_used <= 0: raise HTTPException(status_code=400, detail="Quantity used must be positive.")
    current = float(item.get("current_stock", 0))
    if payload.quantity_used > current: raise HTTPException(status_code=409, detail=f"Insufficient stock. Available: {current:g} {item.get('unit','')}")
    now = _now()
    doc = {**payload.model_dump(), "id": f"use_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}", "item_id": item.get("id"), "item_name": item.get("name"), "created_at": payload.date_time or now, "performed_by": current_user.get("name", "Chef")}
    await inventory_consumption_collection.insert_one(doc)
    amount = payload.quantity_used * float(item.get("last_purchase_price", 0))
    await inventory_items_collection.update_one({"_id": item["_id"]}, {"$inc": {"current_stock": -payload.quantity_used}, "$set": {"updated_at": now}})
    await _audit("CONSUMPTION", item, quantity=-payload.quantity_used, amount=-amount, actor=current_user.get("name", "Chef"), reason=payload.notes or payload.related_order or "Kitchen Production", reference=payload.related_order or doc["id"], status=_status(current - payload.quantity_used, float(item.get("minimum_level", 0))))
    return StandardAPIResponse(success=True, message="Kitchen consumption recorded and stock reduced.", data={"consumption_id": doc["id"]})

@router.get("/consumption")
async def list_consumption(limit: int = 100, current_user: dict = Depends(get_current_admin_or_chef)):
    rows=[]
    cursor=inventory_consumption_collection.find().sort("created_at", -1).limit(limit)
    async for d in cursor: rows.append({k:v for k,v in d.items() if k != "_id"})
    return rows

@router.post("/wastage")
async def add_wastage(payload: WastageCreateRequest, current_user: dict = Depends(get_current_admin_or_chef)):
    item = await _find_item(payload.item_id, payload.item_name or "")
    if not item: raise HTTPException(status_code=404, detail="Inventory item not found.")
    if payload.quantity <= 0: raise HTTPException(status_code=400, detail="Wasted quantity must be positive.")
    current = float(item.get("current_stock", 0))
    if payload.quantity > current: raise HTTPException(status_code=409, detail=f"Insufficient stock. Available: {current:g} {item.get('unit','')}")
    now=_now()
    doc={**payload.model_dump(), "id":f"wst_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}", "item_id": item.get("id"), "item_name": item.get("name"), "created_at":now, "performed_by":current_user.get("name","Chef")}
    await inventory_wastage_collection.insert_one(doc)
    amount=payload.quantity * float(item.get("last_purchase_price",0))
    await inventory_items_collection.update_one({"_id":item["_id"]},{"$inc":{"current_stock":-payload.quantity},"$set":{"updated_at":now}})
    await _audit("WASTAGE",item,quantity=-payload.quantity,amount=-amount,actor=current_user.get("name","Chef"),reason=payload.reason + (f" — {payload.notes}" if payload.notes else ""),reference=doc["id"],status=_status(current - payload.quantity, float(item.get("minimum_level",0))))
    return StandardAPIResponse(success=True,message="Wastage recorded and stock reduced.",data={"wastage_id":doc["id"]})

@router.get("/wastage")
async def list_wastage(limit:int=100,current_user:dict=Depends(get_current_admin_or_chef)):
    rows=[]; cursor=inventory_wastage_collection.find().sort("created_at",-1).limit(limit)
    async for d in cursor: rows.append({k:v for k,v in d.items() if k != "_id"})
    return rows

@router.get("/requirements")
async def list_requirements(status:Optional[str]=None,current_user:dict=Depends(get_current_admin_or_chef)):
    query={}
    if status and status!="All": query["status"]=status
    rows=[]; cursor=purchase_requirements_collection.find(query).sort("request_date",-1)
    async for d in cursor: rows.append({k:v for k,v in d.items() if k != "_id"})
    return rows

@router.post("/requirements")
async def create_requirement(payload:PurchaseRequirementCreateRequest,current_user:dict=Depends(get_current_admin_or_chef)):
    item=await _find_item(payload.item_id, payload.item_name or "")
    if not item: raise HTTPException(status_code=404,detail="Inventory item not found.")
    now=_now(); doc={**payload.model_dump(),"id":f"req_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}","item_id":item.get("id"),"item_name":item.get("name"),"request_date":now,"requested_by":current_user.get("name","Chef"),"status":"Pending"}
    await purchase_requirements_collection.insert_one(doc)
    await _audit("REQUIREMENT CREATED",item,quantity=payload.required_quantity,actor=current_user.get("name","Chef"),reason=payload.reason,reference=doc["id"],status="Pending")
    return StandardAPIResponse(success=True,message="Purchase requirement sent to Admin.",data={k:v for k,v in doc.items() if k != "_id"})

@router.patch("/requirements/{requirement_id}/status")
async def update_requirement_status(requirement_id:str,payload:PurchaseRequirementStatusRequest,current_user:dict=Depends(get_current_admin)):
    valid={"Pending","Approved","Rejected","Purchased","Completed"}
    if payload.status not in valid: raise HTTPException(status_code=400,detail="Invalid requirement status.")
    doc=await purchase_requirements_collection.find_one({"id":requirement_id})
    if not doc: raise HTTPException(status_code=404,detail="Purchase requirement not found.")
    now=_now(); await purchase_requirements_collection.update_one({"_id":doc["_id"]},{"$set":{"status":payload.status,"updated_at":now,"updated_by":current_user.get("name","Admin")}})
    item=await _find_item(doc.get("item_id") or "", doc.get("item_name") or "")
    if item: await _audit(f"REQUIREMENT {payload.status.upper()}",item,quantity=float(doc.get("required_quantity",0)),actor=current_user.get("name","Admin"),reason=doc.get("reason","") ,reference=requirement_id,status=payload.status)
    return StandardAPIResponse(success=True,message=f"Requirement marked {payload.status}.")

@router.post("/adjustment")
async def adjust_stock(payload:InventoryAdjustmentRequest,current_user:dict=Depends(get_current_admin_or_chef)):
    item=await _find_item(payload.item_id)
    if not item: raise HTTPException(status_code=404,detail="Inventory item not found.")
    now=_now(); await inventory_items_collection.update_one({"_id":item["_id"]},{"$inc":{"current_stock":payload.quantity_delta},"$set":{"updated_at":now}})
    await _audit("STOCK ADJUSTMENT",item,quantity=payload.quantity_delta,actor=current_user.get("name","Staff"),reason=payload.reason,reference=payload.reference or item.get("id",""),status=_status(float(item.get("current_stock",0)) + payload.quantity_delta, float(item.get("minimum_level",0))))
    return StandardAPIResponse(success=True,message="Stock adjustment recorded.")

@router.get("/audit")
async def inventory_audit(
    date_from:Optional[str]=None,date_to:Optional[str]=None,item:Optional[str]=None,category:Optional[str]=None,
    performed_by:Optional[str]=None,action:Optional[str]=None,supplier:Optional[str]=None,status:Optional[str]=None,
    search:Optional[str]=None,current_user:dict=Depends(get_current_admin_or_chef)
):
    query={}
    if date_from or date_to:
        created={}
        if date_from: created["$gte"]=date_from
        if date_to: created["$lte"]=date_to + "T23:59:59"
        query["timestamp"]=created
    if item: query["item"]={"$regex":item,"$options":"i"}
    if performed_by: query["performed_by"]={"$regex":performed_by,"$options":"i"}
    if action and action!="All": query["action"]={"$regex":action,"$options":"i"}
    if category: query["category"]={"$regex":category,"$options":"i"}
    if supplier: query["supplier"]={"$regex":supplier,"$options":"i"}
    if status: query["status"]={"$regex":status,"$options":"i"}
    if search: query["$or"]=[{"item":{"$regex":search,"$options":"i"}},{"action":{"$regex":search,"$options":"i"}},{"reason":{"$regex":search,"$options":"i"}},{"reference":{"$regex":search,"$options":"i"}}]
    rows=[]; cursor=inventory_audit_collection.find(query).sort("timestamp",-1).limit(500)
    async for d in cursor: rows.append({k:v for k,v in d.items() if k != "_id"})
    return rows

@router.get("/summary")
async def inventory_summary(current_user:dict=Depends(get_current_admin_or_chef)):
    today=datetime.now(timezone.utc).strftime("%Y-%m-%d")
    purchase_pipeline=[{"$match":{"created_at":{"$regex":f"^{today}"}}},{"$group":{"_id":None,"cost":{"$sum":"$total_cost"},"count":{"$sum":1}}}]
    p=await inventory_purchases_collection.aggregate(purchase_pipeline).to_list(length=1)
    consumption_pipeline=[{"$match":{"created_at":{"$regex":f"^{today}"}}},{"$group":{"_id":None,"cost":{"$sum":{"$multiply":["$quantity_used","$unit_price"]}},"count":{"$sum":1}}}]
    # Existing records may not include unit_price; audit cost remains the authoritative usage value for the UI.
    c=await inventory_audit_collection.aggregate([
        {"$match":{"timestamp":{"$regex":f"^{today}"},"action":"CONSUMPTION"}},
        {"$group":{"_id":None,"cost":{"$sum":{"$abs":{"$ifNull":["$amount",0]}}},"count":{"$sum":1}}}
    ]).to_list(length=1)
    w=await inventory_audit_collection.aggregate([
        {"$match":{"timestamp":{"$regex":f"^{today}"},"action":"WASTAGE"}},
        {"$group":{"_id":None,"cost":{"$sum":{"$abs":{"$ifNull":["$amount",0]}}},"count":{"$sum":1}}}
    ]).to_list(length=1)
    low=await inventory_items_collection.count_documents({"$expr":{"$and":[{"$gt":["$minimum_level",0]},{"$lt":["$current_stock","$minimum_level"]}]}})
    out=await inventory_items_collection.count_documents({"current_stock":{"$lte":0}})
    total_value=await inventory_items_collection.aggregate([{"$group":{"_id":None,"value":{"$sum":{"$multiply":["$current_stock","$last_purchase_price"]}}}}]).to_list(length=1)
    pending=await purchase_requirements_collection.count_documents({"status":"Pending"})
    total_purchase=await inventory_purchases_collection.aggregate([{"$group":{"_id":None,"cost":{"$sum":"$total_cost"}}}]).to_list(length=1)
    return {
        "total_stock_items": await inventory_items_collection.count_documents({}),
        "todays_purchases": float((p[0] if p else {}).get("cost",0)),
        "todays_consumption": float((c[0] if c else {}).get("cost",0)),
        "low_stock_items": low,
        "out_of_stock_items": out,
        "wastage": float((w[0] if w else {}).get("cost",0)),
        "total_purchase_cost": float((total_purchase[0] if total_purchase else {}).get("cost",0)),
        "items_requiring_purchase": low + out,
        "total_inventory_value": float((total_value[0] if total_value else {}).get("value",0)),
        "pending_requirements": pending,
    }
