import asyncio
from typing import Dict, List

from bson import ObjectId

from database import get_db


async def migrate_order_item_images_permanently() -> dict:
    """
    One-time migration for legacy orders.

    Updates existing order documents in MongoDB so every order item gets a
    persisted image_url when the menu catalog still has the item image.
    """
    db = get_db()
    orders_collection = db["orders"]
    menu_items_collection = db["menu_items"]

    menu_items = []
    async for menu_item in menu_items_collection.find({}):
        menu_items.append(menu_item)

    id_to_image: Dict[str, str] = {}
    name_to_image: Dict[str, str] = {}

    for menu_item in menu_items:
        image_url = menu_item.get("image_url")
        if not image_url:
            continue

        menu_item_id = str(menu_item.get("id") or menu_item.get("_id"))
        id_to_image[menu_item_id] = image_url

        name = (menu_item.get("name") or "").strip().lower()
        if name:
            name_to_image[name] = image_url

    orders = []
    async for order in orders_collection.find({}):
        orders.append(order)

    updated_orders = 0
    updated_items = 0

    for order in orders:
        items = order.get("items", [])
        if not isinstance(items, list):
            continue

        changed = False

        for item in items:
            if item.get("image_url"):
                continue

            item_id = item.get("item_id")
            item_name = (item.get("name") or "").strip().lower()
            found_image = None

            if item_id:
                found_image = id_to_image.get(str(item_id))

            if not found_image and item_name:
                found_image = name_to_image.get(item_name)

            if found_image:
                item["image_url"] = found_image
                updated_items += 1
                changed = True

        if changed:
            await orders_collection.update_one(
                {"_id": order["_id"]},
                {"$set": {"items": items}}
            )
            updated_orders += 1

    return {
        "updated_orders": updated_orders,
        "updated_items": updated_items,
        "total_orders": len(orders),
    }


async def main() -> None:
    print("[INFO] Running one-time migration to backfill missing order item images...")
    result = await migrate_order_item_images_permanently()
    print(
        f"[OK] Migration complete: updated {result['updated_orders']} orders and {result['updated_items']} item image references."
    )


if __name__ == "__main__":
    asyncio.run(main())
