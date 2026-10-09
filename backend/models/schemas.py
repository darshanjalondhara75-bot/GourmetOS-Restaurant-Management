from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# Auth & User Schemas
class DirectLoginRequest(BaseModel):
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")
    requested_role: Optional[str] = Field("admin", description="Requested role fallback if user is new: admin, cashier, chef")

class RegisterRequest(BaseModel):
    name: str = Field(..., description="Full Name")
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")
    role: Optional[str] = Field("user", description="Role: user, cashier, chef")

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: Optional[str] = None

class UserCreateRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # admin, cashier, chef, user

class UserRoleUpdateRequest(BaseModel):
    role: str  # admin, cashier, chef, user

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None
    email: Optional[str] = None

# Table Management Schemas
class TableCreateRequest(BaseModel):
    table_number: str
    capacity: int = 4
    status: str = "Available" # Available, Occupied, Reserved, Cleaning

class TableUpdateRequest(BaseModel):
    capacity: Optional[int] = None
    status: Optional[str] = None

class TableResponse(BaseModel):
    id: str
    table_number: str
    capacity: int
    status: str
    qr_code_url: str
    reserved_by_name: Optional[str] = None
    reservation_id: Optional[str] = None
    reserved_at: Optional[str] = None

class TableBookingRequest(BaseModel):
    table_number: str
    customer_name: str

class TableBookingResponse(BaseModel):
    id: str
    table_number: str
    capacity: int
    customer_name: str
    status: str
    booked_at: str
    released_at: Optional[str] = None
    session_token: Optional[str] = None
    order_token: Optional[str] = None
    order_placed: bool = False


# Shift Management Schemas
class ShiftCreateRequest(BaseModel):
    shift_name: str  # Morning, Afternoon, Evening, Night
    start_time: str
    end_time: str
    assigned_user: Optional[str] = None
    status: str = "Active"  # Active, Closed

class ShiftUpdateRequest(BaseModel):
    shift_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    assigned_user: Optional[str] = None
    status: Optional[str] = None

class ShiftAssignmentRequest(BaseModel):
    assigned_user: str

class ShiftReassignRequest(BaseModel):
    shift_id: str
    assigned_user: str


class ShiftResponse(BaseModel):
    id: str
    shift_name: str
    start_time: str
    end_time: str
    assigned_user: Optional[str] = None
    status: str
    created_at: str

# Menu & Category Schemas
class CategoryCreateRequest(BaseModel):
    name: str
    icon: Optional[str] = "utensils"
    sort_order: int = 0

class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    icon: str
    sort_order: int

class MenuItemCreateRequest(BaseModel):
    name: str
    category: str
    price: float
    description: str
    image_url: Optional[str] = None
    is_veg: bool = True
    is_available: bool = True

class MenuItemUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_veg: Optional[bool] = None
    is_available: Optional[bool] = None

class MenuItemResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    description: str
    image_url: str
    is_veg: bool
    is_available: bool

# Cart Schemas
class CartItem(BaseModel):
    item_id: str
    name: str
    quantity: int
    price: float
    notes: Optional[str] = ""
    image_url: Optional[str] = ""

class AddToCartRequest(BaseModel):
    item_id: str
    quantity: Optional[int] = 1
    notes: Optional[str] = ""
    session_token: Optional[str] = None

class UpdateCartItemRequest(BaseModel):
    quantity: Optional[int] = None
    notes: Optional[str] = None
    session_token: Optional[str] = None

class CartResponse(BaseModel):
    table_number: str
    items: List[CartItem]
    total_amount: float
    item_count: int
    updated_at: str

class CheckoutCartRequest(BaseModel):
    session_token: str
    customer_name: Optional[str] = ""
    special_instructions: Optional[str] = ""
    payment_method: Literal["Online", "At Counter"] = "At Counter"

class RazorpayOrderResponse(BaseModel):
    key_id: str
    razorpay_order_id: str
    amount: int
    currency: str
    exchange_rate: Optional[float] = None
    amount_inr: Optional[float] = None
    amount_usd: Optional[float] = None

class RazorpayPaymentVerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# Order Schemas
class OrderItemPayload(BaseModel):
    item_id: str
    name: str
    quantity: int
    price: float
    notes: Optional[str] = ""
    image_url: Optional[str] = ""

class CreateOrderRequest(BaseModel):
    table_number: str
    customer_name: Optional[str] = "Guest Customer"
    items: List[OrderItemPayload]
    special_instructions: Optional[str] = None
    session_token: Optional[str] = None

class TableOrderCreateRequest(BaseModel):
    customer_name: Optional[str] = "Guest Customer"
    items: List[OrderItemPayload]
    special_instructions: Optional[str] = None
    session_token: Optional[str] = None

class AppendItemsRequest(BaseModel):
    items: List[OrderItemPayload]
    special_instructions: Optional[str] = None

class OrderStatusUpdateRequest(BaseModel):
    status: str  # Pending, Accepted, Cooking, Ready, Completed, Cancelled

class AdminCancelRequest(BaseModel):
    reason: str = Field(..., description="Reason for cancellation or refund")
    is_refund: bool = False

class PaymentUpdateRequest(BaseModel):
    payment_status: Optional[str] = "Paid"  # Paid, Unpaid
    payment_method: Optional[str] = "Cash"

class OrderResponse(BaseModel):
    id: str
    order_id: str
    table_number: str
    customer_name: str
    items: List[dict]
    total_amount: float
    status: str  # Pending -> Accepted -> Cooking -> Ready -> Completed
    payment_status: str
    payment_method: Optional[str] = None
    paid_at: Optional[str] = None
    payment_currency: Optional[str] = None
    paid_amount: Optional[float] = None
    payment_exchange_rate: Optional[float] = None
    payment_amount_paise: Optional[int] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    special_instructions: Optional[str] = ""
    created_at: str
    order_token: Optional[str] = None

class InventoryItemResponse(BaseModel):
    id: str
    name: str
    category: str
    unit: str
    opening_stock: float
    current_stock: float
    minimum_level: float
    status: str
    last_purchase_price: float
    updated_at: str

class InventoryItemUpdateRequest(BaseModel):
    category: Optional[str] = None
    unit: Optional[str] = None
    minimum_level: Optional[float] = None
    opening_stock: Optional[float] = None

class PurchaseCreateRequest(BaseModel):
    item_name: str
    category: str = "General"
    quantity: float
    unit: str = "piece"
    unit_price: float
    supplier: str = ""
    purchase_date: str
    invoice_number: str = ""
    notes: str = ""
    bill_image_url: Optional[str] = None
    minimum_level: Optional[float] = 0

class ConsumptionCreateRequest(BaseModel):
    item_id: str
    item_name: Optional[str] = None
    quantity_used: float
    unit: Optional[str] = None
    created_at: Optional[str] = None
    date_time: Optional[str] = None
    related_order: Optional[str] = ""
    notes: str = ""

class WastageCreateRequest(BaseModel):
    item_id: str
    item_name: Optional[str] = None
    quantity: float
    unit: Optional[str] = None
    reason: str
    date: str
    notes: str = ""

class PurchaseRequirementCreateRequest(BaseModel):
    item_id: str
    item_name: Optional[str] = None
    required_quantity: float
    unit: str
    reason: str
    priority: str = "Normal"
    notes: str = ""

class PurchaseRequirementStatusRequest(BaseModel):
    status: str

class InventoryAdjustmentRequest(BaseModel):
    item_id: str
    quantity_delta: float
    reason: str
    reference: Optional[str] = ""

# Notification & Analytics Schemas
class NotificationCreateRequest(BaseModel):
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification content/message")
    type: Optional[str] = Field("order", description="Notification category: order, shift, kitchen, alert")
    target_role: Optional[str] = Field("all", description="Target recipient role: all, admin, cashier, chef")

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str  # order, shift, kitchen, alert
    target_role: str  # all, admin, cashier, chef
    created_at: str
    is_read: bool

class UnreadCountResponse(BaseModel):
    unread_count: int

class StandardAPIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict | list] = None
