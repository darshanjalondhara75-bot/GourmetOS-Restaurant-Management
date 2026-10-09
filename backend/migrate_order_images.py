import asyncio
from database import get_db
from bson import ObjectId

async def migrate_images():
    db = get_db()
    orders_coll = db["orders"]
    menu_coll = db["menu_items"]

    print("Starting image migration for orders...")

    orders = []
    async for order in orders_coll.find({}):
        orders.append(order)

    updated_count = 0
    for order in orders:
        items = order.get("items", [])
        changed = False

        for item in items:
            if not item.get("image_url"):
                item_id = item.get("item_id")
                if not item_id:
                    continue

                # Try to find the item in menu_items
                query = {"$or": [{"id": item_id}, {"_id": item_id}]}
                if ObjectId.is_valid(item_id):
                    query["$or"].append({"_id": ObjectId(item_id)})

                menu_item = await menu_coll.find_one(query)
                if menu_item and menu_item.get("image_url"):
                    item["image_url"] = menu_item["image_url"]
                    changed = True

        if changed:
            await orders_coll.update_one(
                {"_id": order["_id"]},
                {"$set": {"items": items}}
            )
            updated_count += 1

    print(f"Migration completed. Updated {updated_count} orders.")

if __name__ == "__main__":
    asyncio.run(migrate_images())
