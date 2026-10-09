import asyncio
from database import get_db
from bson import ObjectId

async def migrate_images_robust_v2():
    db = get_db()
    orders_coll = db["orders"]
    menu_coll = db["menu_items"]

    print("Starting ultra-robust image migration for orders...")

    menu_items = []
    async for item in menu_coll.find({}):
        menu_items.append(item)

    print(f"Loaded {len(menu_items)} menu items for lookup.")

    orders = []
    async for order in orders_coll.find({}):
        orders.append(order)

    updated_count = 0
    for order in orders:
        items = order.get("items", [])
        changed = False

        for item in items:
            # Only update if image_url is missing, None, or empty string
            if not item.get("image_url"):
                item_id = item.get("item_id")
                item_name = (item.get("name") or "").strip().lower()

                found_img = None

                # 1. Try matching by ID
                if item_id:
                    for m_item in menu_items:
                        m_id = m_item.get("id") or str(m_item.get("_id"))
                        if item_id == m_id:
                            found_img = m_item.get("image_url")
                            break

                # 2. Try matching by Exact Name
                if not found_img and item_name:
                    for m_item in menu_items:
                        m_name = (m_item.get("name") or "").strip().lower()
                        if item_name == m_name:
                            found_img = m_item.get("image_url")
                            break

                # 3. Try matching by Partial Name (Fuzzy)
                if not found_img and item_name:
                    for m_item in menu_items:
                        m_name = (m_item.get("name") or "").strip().lower()
                        if item_name in m_name or m_name in item_name:
                            found_img = m_item.get("image_url")
                            break

                if found_img:
                    item["image_url"] = found_img
                    changed = True

        if changed:
            await orders_coll.update_one(
                {"_id": order["_id"]},
                {"$set": {"items": items}}
            )
            updated_count += 1

    print(f"Migration completed. Updated {updated_count} orders using ID and Fuzzy Name matching.")

if __name__ == "__main__":
    asyncio.run(migrate_images_robust_v2())
