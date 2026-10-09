from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from database import categories_collection, menu_items_collection
from models.schemas import (
    CategoryResponse, CategoryCreateRequest, CategoryUpdateRequest,
    MenuItemResponse, MenuItemCreateRequest, MenuItemUpdateRequest,
    StandardAPIResponse
)
from utils.security import get_current_admin, get_current_chef, get_current_chef_or_admin

router = APIRouter(prefix="/api/menu", tags=["Menu Management"])

def _build_category_query(cat_id: str) -> dict:
    """Multi-field category lookup supporting id, name, string _id & ObjectId."""
    conditions = [{"id": cat_id}, {"name": cat_id}, {"_id": cat_id}]
    clean_id = cat_id[4:] if cat_id.startswith("cat_") else cat_id
    if ObjectId.is_valid(clean_id):
        conditions.append({"_id": ObjectId(clean_id)})
        conditions.append({"id": clean_id})
    if ObjectId.is_valid(cat_id):
        conditions.append({"_id": ObjectId(cat_id)})
    return {"$or": conditions}

def _build_item_query(item_id: str) -> dict:
    """Multi-field menu item lookup supporting id, name, string _id & ObjectId."""
    conditions = [{"id": item_id}, {"name": item_id}, {"_id": item_id}]
    clean_id = item_id[5:] if item_id.startswith("item_") else item_id
    if ObjectId.is_valid(clean_id):
        conditions.append({"_id": ObjectId(clean_id)})
        conditions.append({"id": clean_id})
    if ObjectId.is_valid(item_id):
        conditions.append({"_id": ObjectId(item_id)})
    return {"$or": conditions}

# ----------------------------------------------------
# 📁 CATEGORIES MANAGEMENT APIS
# ----------------------------------------------------
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories():
    """
    List all menu categories. Public & Admin access.
    """
    categories = []
    try:
        cursor = categories_collection.find().sort("sort_order", 1)
        async for doc in cursor:
            c_id = str(doc.get("id") or doc.get("_id"))
            categories.append(CategoryResponse(
                id=c_id,
                name=doc.get("name", "Uncategorized"),
                icon=doc.get("icon", "utensils"),
                sort_order=int(doc.get("sort_order", 0))
            ))
    except Exception as err:
        print(f"[WARN] Error fetching categories: {err}")
    return categories

@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category_by_id(category_id: str):
    """
    Get single category details by Category ID, Name, or ObjectId.
    """
    query = _build_category_query(category_id)
    doc = await categories_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found.")
    c_id = str(doc.get("id") or doc.get("_id"))
    return CategoryResponse(
        id=c_id,
        name=doc.get("name", "Uncategorized"),
        icon=doc.get("icon", "utensils"),
        sort_order=int(doc.get("sort_order", 0))
    )

@router.post("/categories", response_model=CategoryResponse)
async def create_category(payload: CategoryCreateRequest, current_user: dict = Depends(get_current_chef_or_admin)):
    """
    Create a new menu category.
    """
    cat_id = f"cat_{payload.name.lower().replace(' ', '_')}"
    cat_doc = {
        "id": cat_id,
        "name": payload.name,
        "icon": payload.icon or "utensils",
        "sort_order": payload.sort_order
    }
    await categories_collection.insert_one(cat_doc)
    return CategoryResponse(**cat_doc)

@router.patch("/categories/{category_id}", response_model=StandardAPIResponse)
@router.put("/categories/{category_id}", response_model=StandardAPIResponse)
async def update_category(category_id: str, payload: CategoryUpdateRequest, current_admin: dict = Depends(get_current_admin)):
    """
    Update category details (name, icon, sort_order) by ID, Name, or ObjectId.
    """
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    query = _build_category_query(category_id)
    result = await categories_collection.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found.")
    return StandardAPIResponse(success=True, message="Category updated successfully.", data=update_data)

@router.delete("/categories/{category_id}", response_model=StandardAPIResponse)
async def delete_category(category_id: str, current_chef: dict = Depends(get_current_chef)):
    """
    Delete a category by ID, Name, or ObjectId.
    """
    query = _build_category_query(category_id)
    result = await categories_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found.")
    return StandardAPIResponse(success=True, message="Category deleted.")

# ----------------------------------------------------
# 🍕 MENU ITEMS MANAGEMENT APIS
# ----------------------------------------------------
@router.get("/items", response_model=List[MenuItemResponse])
async def list_menu_items(category: Optional[str] = None):
    """
    List menu items with optional category filter. Public & Admin access.
    """
    query = {}
    if category and category.lower() != "all":
        query["category"] = category

    items = []
    try:
        cursor = menu_items_collection.find(query)
        async for doc in cursor:
            m_id = str(doc.get("id") or doc.get("_id"))
            items.append(MenuItemResponse(
                id=m_id,
                name=doc.get("name", ""),
                category=doc.get("category", "Main Course"),
                price=float(doc.get("price", 0.0)),
                description=doc.get("description", ""),
                image_url=doc.get("image_url", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"),
                is_veg=bool(doc.get("is_veg", True)),
                is_available=bool(doc.get("is_available", True))
            ))
    except Exception as err:
        print(f"[WARN] Error fetching menu items: {err}")
    return items

@router.get("/items/{item_id}", response_model=MenuItemResponse)
async def get_menu_item_by_id(item_id: str):
    """
    Get single menu item details by ID, Name, or ObjectId.
    """
    query = _build_item_query(item_id)
    doc = await menu_items_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Menu item not found.")
    m_id = str(doc.get("id") or doc.get("_id"))
    return MenuItemResponse(
        id=m_id,
        name=doc.get("name", ""),
        category=doc.get("category", "Main Course"),
        price=float(doc.get("price", 0.0)),
        description=doc.get("description", ""),
        image_url=doc.get("image_url", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"),
        is_veg=bool(doc.get("is_veg", True)),
        is_available=bool(doc.get("is_available", True))
    )

@router.post("/items", response_model=MenuItemResponse)
async def create_menu_item(payload: MenuItemCreateRequest, current_user: dict = Depends(get_current_chef_or_admin)):
    """
    Create a new menu item with pricing, description, veg toggle, and image URL.
    """
    item_id = f"item_{payload.name.lower().replace(' ', '_')}"
    fallback_img = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"
    item_doc = {
        "id": item_id,
        "name": payload.name,
        "category": payload.category,
        "price": payload.price,
        "description": payload.description,
        "image_url": payload.image_url or fallback_img,
        "is_veg": payload.is_veg,
        "is_available": payload.is_available
    }
    await menu_items_collection.insert_one(item_doc)
    return MenuItemResponse(**item_doc)

@router.patch("/items/{item_id}", response_model=StandardAPIResponse)
@router.put("/items/{item_id}", response_model=StandardAPIResponse)
async def update_menu_item(item_id: str, payload: MenuItemUpdateRequest, current_user: dict = Depends(get_current_chef_or_admin)):
    """
    Update menu item details, availability toggle, or pricing by ID, Name, or ObjectId.
    """
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    query = _build_item_query(item_id)
    result = await menu_items_collection.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found.")
    
    return StandardAPIResponse(success=True, message="Menu item updated successfully.", data=update_data)

@router.patch("/items/{item_id}/price", response_model=StandardAPIResponse)
@router.put("/items/{item_id}/price", response_model=StandardAPIResponse)
async def update_item_price(item_id: str, price: float = Query(..., description="New item price"), current_admin: dict = Depends(get_current_admin)):
    """
    Pricing Update API: Quick price change for a menu item.
    """
    query = _build_item_query(item_id)
    result = await menu_items_collection.update_one(query, {"$set": {"price": price}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found.")
    return StandardAPIResponse(success=True, message=f"Item price updated to ${price}.", data={"item_id": item_id, "price": price})

@router.patch("/items/{item_id}/availability", response_model=StandardAPIResponse)
@router.put("/items/{item_id}/availability", response_model=StandardAPIResponse)
async def toggle_item_availability(item_id: str, is_available: bool = Query(..., description="Availability status: true or false"), current_admin: dict = Depends(get_current_admin)):
    """
    Availability Toggle API: Enable or disable item availability in menu.
    """
    query = _build_item_query(item_id)
    result = await menu_items_collection.update_one(query, {"$set": {"is_available": is_available}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found.")
    return StandardAPIResponse(success=True, message=f"Item availability set to {is_available}.", data={"item_id": item_id, "is_available": is_available})

@router.delete("/items/{item_id}", response_model=StandardAPIResponse)
async def delete_menu_item(item_id: str, current_chef: dict = Depends(get_current_chef)):
    """
    Delete a menu item by ID, Name, or ObjectId.
    """
    query = _build_item_query(item_id)
    result = await menu_items_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found.")
    return StandardAPIResponse(success=True, message="Menu item deleted.")

# ----------------------------------------------------
# 📲 TABLE-WISE CUSTOMER MENU API
# ----------------------------------------------------
@router.get("/table/{table_identifier}")
async def get_table_wise_customer_menu(table_identifier: str):
    """
    Table-Wise Customer Menu API:
    - Validates table identifier (e.g. '1', 'tbl_1', 'T-07').
    - Returns table status & details.
    - Returns available categories & available menu items for customer self-ordering.
    """
    from database import tables_collection
    clean_num = table_identifier.replace("tbl_", "").replace("table_", "").replace("T", "").strip()
    table_query = {
        "$or": [
            {"id": table_identifier},
            {"table_number": table_identifier},
            {"table_number": clean_num},
            {"_id": table_identifier}
        ]
    }
    if ObjectId.is_valid(table_identifier):
        table_query["$or"].append({"_id": ObjectId(table_identifier)})

    table_doc = await tables_collection.find_one(table_query)
    if not table_doc:
        raise HTTPException(status_code=404, detail=f"Table '{table_identifier}' not found.")

    t_num = table_doc.get("table_number", table_identifier)

    # Fetch Categories
    categories = []
    cat_cursor = categories_collection.find().sort("sort_order", 1)
    async for c in cat_cursor:
        categories.append({
            "id": str(c.get("id") or c.get("_id")),
            "name": c.get("name", "Uncategorized"),
            "icon": c.get("icon", "utensils"),
            "sort_order": int(c.get("sort_order", 0))
        })

    # Fetch Available Menu Items
    items = []
    item_cursor = menu_items_collection.find({"is_available": True})
    async for doc in item_cursor:
        items.append({
            "id": str(doc.get("id") or doc.get("_id")),
            "name": doc.get("name", ""),
            "category": doc.get("category", "Main Course"),
            "price": float(doc.get("price", 0.0)),
            "description": doc.get("description", ""),
            "image_url": doc.get("image_url", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"),
            "is_veg": bool(doc.get("is_veg", True)),
            "is_available": True
        })

    return {
        "table": {
            "id": table_doc.get("id", str(table_doc.get("_id"))),
            "table_number": t_num,
            "capacity": table_doc.get("capacity", 4),
            "status": table_doc.get("status", "Available")
        },
        "categories": categories,
        "items": items
    }

