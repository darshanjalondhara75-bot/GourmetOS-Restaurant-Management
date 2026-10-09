import asyncio
from database import get_db
from bson import ObjectId

async def migrate_images_robust():
    db = get_db()
    orders_coll = db["orders"]
    menu_coll = db["menu_items"]

    print("Starting robust image migration for orders...")

    # Load all menu items into a lookup map for efficiency
    # Map both ID and Name to the image_url
    id_to_img = {}
    name_to_img = {}

    async for menu_item in menu_coll.find({}):
        img = menu_item.get("image_url")
        if img:
            # Store by ID
            m_id = menu_item.get("id") or str(menu_item.get("_id"))
            id_to_img[m_id] = img
            # Store by Name (normalized)
            name = menu_item.get("name", "").strip().lower()
            if name:
                name_to_img[name] = img

    print(f"Loaded {len(id_to_img)} menu items for lookup.")

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
                item_name = (item.get("name") or "").strip().lower()

                found_img = None

                # 1. Try matching by ID
                if item_id and item_id in id_to_img:
                    found_img = id_to_img[item_id]

                # 2. Try matching by Name if ID failed
                if not found_img and item_name in name_to_img:
                    found_img = name_to_img[item_name]

                if found_img:
                    item["image_url"] = found_img
                    changed = True

        if changed:
            await orders_coll.update_one(
                {"_id": order["_id"]},
                {"$set": {"items": items}}
            )
            updated_count += 1

    print(f"Migration completed. Updated {updated_count} orders using ID and Name matching.")

if __name__ == "__main__":
    asyncio.run(migrate_images_robust())
