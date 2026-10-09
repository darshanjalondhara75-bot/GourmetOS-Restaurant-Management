import asyncio
from database import get_db

async def list_menu():
    db = get_db()
    async for item in db["menu_items"].find({}):
        print(f"Name: {item.get('name')}, ID: {item.get('id')}, Img: {item.get('image_url')}")

if __name__ == "__main__":
    asyncio.run(list_menu())
