import os
import sys
import uvicorn

# Ensure backend directory is in python path
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

if __name__ == "__main__":
    print("🚀 Starting Admin Auth FastAPI Backend Server...")
    print("🌐 Backend URL: http://127.0.0.1:8000")
    print("📖 Interactive Swagger API Docs: http://127.0.0.1:8000/docs")
    
    # Change current working directory to backend so relative paths work
    os.chdir(backend_path)
    
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
