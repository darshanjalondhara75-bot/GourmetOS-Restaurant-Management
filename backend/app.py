import os
import sys
import uvicorn

# Add backend directory to sys.path for clean module imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("[INFO] Starting Modular Admin Auth FastAPI Backend Server...")
    print("[INFO] Backend URL: http://127.0.0.1:8000")
    print("[INFO] Interactive Swagger API Docs: http://127.0.0.1:8000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
