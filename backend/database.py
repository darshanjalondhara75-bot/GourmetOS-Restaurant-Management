from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URL, DATABASE_NAME

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(
            MONGO_URL,
            serverSelectionTimeoutMS=1500,
            connectTimeoutMS=1500,
            socketTimeoutMS=1500,
            maxPoolSize=50,
            minPoolSize=5
        )
        _db = _client[DATABASE_NAME]
    return _db

class CollectionProxy:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    @property
    def _coll(self):
        return get_db()[self.collection_name]

    def find(self, *args, **kwargs):
        return self._coll.find(*args, **kwargs)

    def aggregate(self, *args, **kwargs):
        return self._coll.aggregate(*args, **kwargs)

    async def find_one(self, *args, **kwargs):
        return await self._coll.find_one(*args, **kwargs)

    async def insert_one(self, *args, **kwargs):
        return await self._coll.insert_one(*args, **kwargs)

    async def insert_many(self, *args, **kwargs):
        return await self._coll.insert_many(*args, **kwargs)

    async def update_one(self, *args, **kwargs):
        return await self._coll.update_one(*args, **kwargs)

    async def update_many(self, *args, **kwargs):
        return await self._coll.update_many(*args, **kwargs)

    async def delete_one(self, *args, **kwargs):
        return await self._coll.delete_one(*args, **kwargs)

    async def delete_many(self, *args, **kwargs):
        return await self._coll.delete_many(*args, **kwargs)

    async def count_documents(self, *args, **kwargs):
        return await self._coll.count_documents(*args, **kwargs)

    async def create_index(self, *args, **kwargs):
        return await self._coll.create_index(*args, **kwargs)

    def __getattr__(self, name):
        return getattr(self._coll, name)

# Collection proxies
users_collection = CollectionProxy("users")
admins_collection = CollectionProxy("users")
tables_collection = CollectionProxy("tables")
shifts_collection = CollectionProxy("shifts")
categories_collection = CollectionProxy("categories")
menu_items_collection = CollectionProxy("menu_items")
orders_collection = CollectionProxy("orders")
notifications_collection = CollectionProxy("notifications")
logs_collection = CollectionProxy("login_logs")
refresh_tokens_collection = CollectionProxy("refresh_tokens")  # For token rotation & breach detection
carts_collection = CollectionProxy("carts")
bookings_collection = CollectionProxy("table_bookings")
customer_sessions_collection = CollectionProxy("customer_sessions")
plans_collection = CollectionProxy("plan_transactions")
inventory_items_collection = CollectionProxy("inventory_items")
inventory_purchases_collection = CollectionProxy("inventory_purchases")
inventory_consumption_collection = CollectionProxy("inventory_consumption")
inventory_wastage_collection = CollectionProxy("inventory_wastage")
purchase_requirements_collection = CollectionProxy("purchase_requirements")
inventory_audit_collection = CollectionProxy("inventory_audit")

async def init_db():
    """
    Initializes MongoDB database collections and unique indexes efficiently.
    """
    try:
        db_instance = get_db()
        await db_instance["users"].create_index("email", unique=True)
        await db_instance["tables"].create_index("table_number", unique=True)
        await db_instance["orders"].create_index("order_id", unique=True)
        await db_instance["carts"].create_index("table_number", unique=True)
        await db_instance["refresh_tokens"].create_index("jti", unique=True)
        await db_instance["refresh_tokens"].create_index("email")
        await db_instance["table_bookings"].create_index([("user_id", 1), ("status", 1)])
        await db_instance["table_bookings"].create_index([("table_number", 1), ("status", 1)])
        await db_instance["customer_sessions"].create_index("token_hash", unique=True)
        await db_instance["customer_sessions"].create_index("expires_at_dt", expireAfterSeconds=0)
        await db_instance["inventory_items"].create_index("name_key", unique=True)
        await db_instance["inventory_purchases"].create_index("created_at")
        await db_instance["inventory_consumption"].create_index("created_at")
        await db_instance["inventory_wastage"].create_index("created_at")
        await db_instance["purchase_requirements"].create_index("status")
        await db_instance["inventory_audit"].create_index("timestamp")

        # Keep the seeded admin email as the only administrator account.
        await db_instance["users"].update_many(
            {
                "role": "admin",
                "email": {"$ne": "admin@restaurant.com"}
            },
            {"$set": {"role": "cashier"}}
        )

        # Normalize legacy table labels such as "012" and "T-15" to "12" and "15".
        table_cursor = db_instance["tables"].find({})
        async for table in table_cursor:
            old_number = str(table.get("table_number", "")).strip()
            digits = "".join(character for character in old_number if character.isdigit())
            if not digits:
                continue
            new_number = str(int(digits))
            if old_number == new_number:
                continue

            conflict = await db_instance["tables"].find_one({
                "table_number": new_number,
                "_id": {"$ne": table["_id"]}
            })
            if conflict:
                print(f"[WARN] Skipping table normalization for {old_number}: table {new_number} already exists.")
                continue

            await db_instance["tables"].update_one(
                {"_id": table["_id"]},
                {"$set": {
                    "table_number": new_number,
                    "id": f"tbl_{new_number}",
                    "qr_code_url": f"/customer/menu?tableId={new_number}"
                }}
            )
            await db_instance["carts"].update_many(
                {"table_number": old_number},
                {"$set": {"table_number": new_number}}
            )
            await db_instance["orders"].update_many(
                {"table_number": old_number},
                {"$set": {"table_number": new_number}}
            )
            print(f"[OK] Normalized table {old_number} to {new_number}.")

        # Keep booking and menu-session references aligned with normalized table numbers.
        for collection_name in ("table_bookings", "customer_sessions"):
            cursor = db_instance[collection_name].find({"table_number": {"$exists": True}})
            async for record in cursor:
                old_number = str(record.get("table_number", "")).strip()
                digits = "".join(character for character in old_number if character.isdigit())
                if not digits:
                    continue
                new_number = str(int(digits))
                if old_number == new_number:
                    continue
                table_exists = await db_instance["tables"].find_one({"table_number": new_number})
                if table_exists:
                    await db_instance[collection_name].update_one(
                        {"_id": record["_id"]},
                        {"$set": {"table_number": new_number}}
                    )

        print("[OK] MongoDB restaurant database indexes initialized successfully.")
    except Exception as e:
        print(f"[WARN] MongoDB Initialization Warning: {e}")
