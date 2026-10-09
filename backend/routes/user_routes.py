from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from database import users_collection, orders_collection
from models.schemas import UserResponse, UserCreateRequest, UserRoleUpdateRequest, StandardAPIResponse, OrderResponse
from utils.security import get_current_admin, require_current_user, hash_password

router = APIRouter(prefix="/api/users", tags=["User Management"])

def _build_user_query(user_id: str) -> dict:
    """Builds multi-field query supporting custom id, email, Mongo _id string & ObjectId."""
    conditions = [{"id": user_id}, {"email": user_id}, {"_id": user_id}]
    
    clean_id = user_id[4:] if user_id.startswith("usr_") else user_id
    if ObjectId.is_valid(clean_id):
        conditions.append({"_id": ObjectId(clean_id)})
        conditions.append({"id": clean_id})
    if ObjectId.is_valid(user_id):
        conditions.append({"_id": ObjectId(user_id)})
        
    return {"$or": conditions}

@router.get("", response_model=List[UserResponse])
async def list_users(current_admin: dict = Depends(get_current_admin)):
    """
    List all users stored in MongoDB (Admin, Customer/User, Cashier, Chef).
    """
    users = []
    try:
        cursor = users_collection.find()
        async for doc in cursor:
            users.append(UserResponse(
                id=doc.get("id", str(doc.get("_id"))),
                email=doc.get("email", ""),
                name=doc.get("name", ""),
                role=doc.get("role", "admin"),
                created_at=doc.get("created_at")
            ))
    except Exception as err:
        print(f"[WARN] Error fetching users from MongoDB: {err}")
    return users

@router.post("", response_model=UserResponse)
async def create_user(payload: UserCreateRequest, current_admin: dict = Depends(get_current_admin)):
    """
    Create a new user (Customer/User, Cashier, or Chef) in MongoDB.
    """
    clean_email = payload.email.strip().lower()
    new_role = payload.role.lower()
    if new_role not in ["user", "cashier", "chef"]:
        raise HTTPException(status_code=400, detail="Role must be Customer/User, Cashier, or Chef.")
    existing = await users_collection.find_one({"email": clean_email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    user_id = f"usr_{int(datetime.now(timezone.utc).timestamp())}"
    user_doc = {
        "id": user_id,
        "email": clean_email,
        "name": payload.name,
        "role": new_role,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await users_collection.insert_one(user_doc)
    return UserResponse(
        id=user_id,
        email=clean_email,
        name=payload.name,
        role=new_role,
        created_at=user_doc["created_at"]
    )

@router.patch("/{user_id}/role", response_model=StandardAPIResponse)
@router.put("/{user_id}/role", response_model=StandardAPIResponse)
async def update_user_role(user_id: str, payload: UserRoleUpdateRequest, current_admin: dict = Depends(get_current_admin)):
    """
    Update a user's role in MongoDB (e.g., from 'admin' to 'chef').
    Supports lookup by ID, Email, or Mongo ObjectId.
    """
    new_role = payload.role.lower()
    if new_role not in ["user", "cashier", "chef"]:
        raise HTTPException(status_code=400, detail="Role must be Customer/User, Cashier, or Chef.")
    
    query = _build_user_query(user_id)
    target_user = await users_collection.find_one(query)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found in MongoDB.")
    if target_user.get("id") == "usr_admin" or target_user.get("email") == "admin@restaurant.com":
        raise HTTPException(status_code=400, detail="The primary admin account cannot be changed.")

    result = await users_collection.update_one(query, {"$set": {"role": new_role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found in MongoDB.")
    
    return StandardAPIResponse(
        success=True,
        message=f"User role updated to '{new_role}' successfully.",
        data={"user_id": user_id, "new_role": new_role}
    )

@router.delete("/{user_id}", response_model=StandardAPIResponse)
async def delete_user(user_id: str, current_admin: dict = Depends(get_current_admin)):
    """
    Delete a user from MongoDB by ID, Email, or Mongo ObjectId.
    """
    query = _build_user_query(user_id)
    target_user = await users_collection.find_one(query)
    if target_user and (
        target_user.get("id") == "usr_admin"
        or target_user.get("email") == "admin@restaurant.com"
    ):
        raise HTTPException(status_code=400, detail="The primary admin account cannot be deleted.")

    result = await users_collection.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")
    return StandardAPIResponse(success=True, message="User deleted successfully.")



customer_router = APIRouter(prefix="/api/user", tags=["Customer User Panel"])

@customer_router.get("/orders", response_model=List[OrderResponse])
async def get_my_orders(current_user: dict = Depends(require_current_user)):
    if current_user.get("role") not in {"user", "customer"}:
        raise HTTPException(status_code=403, detail="Customer/User access is required.")
    orders=[]
    cursor=orders_collection.find({"customer_user_id": current_user.get("sub")}).sort("created_at", -1)
    async for doc in cursor:
        orders.append(OrderResponse(
            id=doc.get("id", str(doc.get("_id"))), order_id=doc.get("order_id", "ORD-000"),
            table_number=doc.get("table_number", ""), customer_name=doc.get("customer_name", "Guest"),
            items=doc.get("items", []), total_amount=float(doc.get("total_amount", 0)), status=doc.get("status", "Pending"),
            payment_status=doc.get("payment_status", "Unpaid"), payment_method=doc.get("payment_method"),
            paid_at=doc.get("paid_at"), special_instructions=doc.get("special_instructions", ""), created_at=doc.get("created_at", "")
        ))
    return orders
