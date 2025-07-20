
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 설정 (프론트엔드와 통신을 위해 필요)
origins = [
    "http://localhost:3002",  # 프론트엔드 개발 서버 주소
    "https://psychology-research.onedaytrading.net", # 배포된 프론트엔드 주소
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI Backend!"}

@app.get("/api/data")
async def get_data():
    return {"data": "This is some data from the backend."}
