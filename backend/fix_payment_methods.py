import asyncio
from database import get_db

async def fix_payment_methods():
    db = get_db()
    orders_coll = db["orders"]

    print("Starting payment method cleanup migration...")

    # Find orders that are Paid but have no payment_method
    query = {
        "payment_status": "Paid",
        "$or": [
            {"payment_method": {"$exists": False}},
            {"payment_method": None},
            {"payment_method": ""}
        ]
    }

    cursor = orders_coll.find(query)
    count = 0
    async for order in cursor:
        await orders_coll.update_one(
            {"_id": order["_id"]},
            {"$set": {"payment_method": "Cash"}}
        )
        count += 1

    print(f"Migration completed. Fixed {count} orders by setting default payment method to 'Cash'.")

if __name__ == "__main__":
    asyncio.run(fix_payment_methods())
