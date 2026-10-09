import asyncio
from database import get_db

async def inspect_payment():
    db = get_db()
    order = await db["orders"].find_one({"order_id": "ORD-1788161128224"})
    if order:
        print(f"Order found.")
        print(f"Payment Status: {order.get('payment_status')}")
        print(f"Payment Method: {order.get('payment_method')}")
        print(f"Status: {order.get('status')}")
    else:
        print("Order not found.")

if __name__ == "__main__":
    asyncio.run(inspect_payment())
