import asyncio
from database import get_db
from bson import ObjectId

async def inspect_order():
    db = get_db()
    order = await db["orders"].find_one({"order_id": "ORD-1788168311315"})
    if order:
        print("Order found:")
        for item in order.get("items", []):
            print(f"Item: {item.get('name')}, ID: {item.get('item_id')}, Image: {item.get('image_url')}")
    else:
        print("Order not found.")

if __name__ == "__main__":
    asyncio.run(inspect_order())
