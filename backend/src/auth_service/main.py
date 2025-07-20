from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware
from . import models
from .database import engine
from .routers import router
import os
import shutil

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
origins = [
    "http://localhost",
    "http://localhost:3001", # Allow requests from your Next.js frontend
    "http://127.0.0.1:3001",
    "http://[::1]:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"], # Allow all headers, including Authorization
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Ensure the avatars directory exists
AVATAR_DIR = "static/avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

@app.post("/upload/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    file_extension = file.filename.split(".").pop()
    file_name = f"{os.urandom(16).hex()}.{file_extension}"
    file_path = os.path.join(AVATAR_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file_name, "url": f"/static/avatars/{file_name}"}

app.include_router(router)
