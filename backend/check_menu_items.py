import asyncio
from database import get_db
from bson import ObjectId

async def check_menu():
    db = get_db()
    for item_id in ["itm_1725000001", "itm_1725000002"]:
        query = {"$or": [{"id": item_id}, {"_id": item_id}]}
        if ObjectId.is_valid(item_id):
            query["$or"].append({"_id": ObjectId(item_id)})

        item = await db["menu_items"].find_one(query)
        print(f"ID {item_id} -> Found: {item is not None}, Image: {item.get('image_url') if item else 'N/A'}")

if __name__ == "__main__":
    asyncio.run(check_menu())
