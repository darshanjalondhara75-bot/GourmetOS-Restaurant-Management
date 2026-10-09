from datetime import datetime, timezone
from database import (
    users_collection, tables_collection, categories_collection,
    menu_items_collection, shifts_collection
)
from utils.security import hash_password

async def seed_initial_data():
    """
    Populates MongoDB database with default restaurant tables, categories, menu items, shifts, and default role users if empty.
    """
    try:
        # 1. Seed Default Users (Admin, Cashier, Chef)
        if await users_collection.count_documents({}) == 0:
            default_users = [
                {
                    "id": "usr_admin",
                    "email": "admin@restaurant.com",
                    "name": "Alex Smith (Admin)",
                    "role": "admin",
                    "password_hash": hash_password("admin123"),
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": "usr_cashier",
                    "email": "cashier@restaurant.com",
                    "name": "Sarah Connor (Cashier)",
                    "role": "cashier",
                    "password_hash": hash_password("cashier123"),
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": "usr_chef",
                    "email": "chef@restaurant.com",
                    "name": "Gordon Ramsay (Chef)",
                    "role": "chef",
                    "password_hash": hash_password("chef123"),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            ]
            await users_collection.insert_many(default_users)
            print("[SEED] Default Users inserted into MongoDB.")

        # 2. Seed Tables
        if await tables_collection.count_documents({}) == 0:
            default_tables = [
                {"id": "tbl_1", "table_number": "1", "capacity": 2, "status": "Available", "qr_code_url": "/customer/menu?tableId=1"},
                {"id": "tbl_2", "table_number": "2", "capacity": 4, "status": "Available", "qr_code_url": "/customer/menu?tableId=2"},
                {"id": "tbl_3", "table_number": "3", "capacity": 4, "status": "Available", "qr_code_url": "/customer/menu?tableId=3"},
                {"id": "tbl_4", "table_number": "4", "capacity": 6, "status": "Available", "qr_code_url": "/customer/menu?tableId=4"},
                {"id": "tbl_5", "table_number": "5", "capacity": 2, "status": "Available", "qr_code_url": "/customer/menu?tableId=5"},
                {"id": "tbl_6", "table_number": "6", "capacity": 8, "status": "Available", "qr_code_url": "/customer/menu?tableId=6"},
            ]
            await tables_collection.insert_many(default_tables)
            print("[SEED] Default Dining Tables inserted into MongoDB.")

        # 3. Seed Categories
        if await categories_collection.count_documents({}) == 0:
            default_categories = [
                {"id": "cat_appetizers", "name": "Appetizers", "icon": "soup", "sort_order": 1},
                {"id": "cat_mains", "name": "Main Course", "icon": "utensils", "sort_order": 2},
                {"id": "cat_desserts", "name": "Desserts", "icon": "cake", "sort_order": 3},
                {"id": "cat_beverages", "name": "Beverages", "icon": "coffee", "sort_order": 4},
                {"id": "cat_specials", "name": "Chef Specials", "icon": "sparkles", "sort_order": 5},
            ]
            await categories_collection.insert_many(default_categories)
            print("[SEED] Default Categories inserted into MongoDB.")

        # 4. Seed Menu Items
        if await menu_items_collection.count_documents({}) == 0:
            default_items = [
                {
                    "id": "item_1",
                    "name": "Truffle Mushroom Burger",
                    "category": "Main Course",
                    "price": 16.99,
                    "description": "Brioche bun, wagyu beef patty, sauteed wild mushrooms, black truffle aioli, aged swiss cheese.",
                    "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
                    "is_veg": False,
                    "is_available": True
                },
                {
                    "id": "item_2",
                    "name": "Artisanal Margherita Pizza",
                    "category": "Main Course",
                    "price": 14.50,
                    "description": "San Marzano tomato sauce, fresh buffalo mozzarella, organic basil, extra virgin olive oil.",
                    "image_url": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80",
                    "is_veg": True,
                    "is_available": True
                },
                {
                    "id": "item_3",
                    "name": "Crispy Garlic Parmesan Fries",
                    "category": "Appetizers",
                    "price": 6.99,
                    "description": "Hand-cut Idaho potatoes tossed with roasted garlic, freshly grated parmesan, and rosemary.",
                    "image_url": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
                    "is_veg": True,
                    "is_available": True
                },
                {
                    "id": "item_4",
                    "name": "Pan-Seared Salmon Bowl",
                    "category": "Chef Specials",
                    "price": 21.00,
                    "description": "Atlantic salmon, quinoa, avocado, edamame, cucumber ribbon, citrus ponzu dressing.",
                    "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
                    "is_veg": False,
                    "is_available": True
                },
                {
                    "id": "item_5",
                    "name": "Classic Berry Tiramisu",
                    "category": "Desserts",
                    "price": 8.50,
                    "description": "Espresso-soaked ladyfingers, velvety mascarpone cream, fresh raspberry coulis.",
                    "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
                    "is_veg": True,
                    "is_available": True
                },
                {
                    "id": "item_6",
                    "name": "Signature Iced Matcha Latte",
                    "category": "Beverages",
                    "price": 5.75,
                    "description": "Ceremonial grade Uji matcha, oat milk, organic vanilla syrup, served over ice.",
                    "image_url": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80",
                    "is_veg": True,
                    "is_available": True
                }
            ]
            await menu_items_collection.insert_many(default_items)
            print("[SEED] Default Menu Items inserted into MongoDB.")

        # 5. Seed Shifts
        if await shifts_collection.count_documents({}) == 0:
            default_shifts = [
                {
                    "id": "shf_1",
                    "shift_name": "Morning Breakfast & Brunch",
                    "start_time": "07:00 AM",
                    "end_time": "03:00 PM",
                    "assigned_user": "Sarah Connor (Cashier)",
                    "status": "Active",
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": "shf_2",
                    "shift_name": "Evening Dinner Rush",
                    "start_time": "03:00 PM",
                    "end_time": "11:00 PM",
                    "assigned_user": "Gordon Ramsay (Chef)",
                    "status": "Active",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            ]
            await shifts_collection.insert_many(default_shifts)
            print("[SEED] Default Shifts inserted into MongoDB.")

    except Exception as e:
        print(f"[WARN] Database seeding skipped: {e}")
