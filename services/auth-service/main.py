from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET = "ingredio_secret_key_2026_minimum_32_chars"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

users = {}

@app.post("/auth/register")
def register(data: dict):
    email = data["email"]
    password = data["password"]

    if email in users:
        raise HTTPException(status_code=400, detail="Użytkownik istnieje")

    users[email] = pwd_context.hash(password)
    return {"message": "ok"}

@app.post("/auth/login")
def login(data: dict):
    email = data["email"]
    password = data["password"]

    if email not in users:
        raise HTTPException(status_code=400, detail="Błędne dane")

    if not pwd_context.verify(password, users[email]):
        raise HTTPException(status_code=400, detail="Błędne dane")

    token = jwt.encode(
        {"email": email, "exp": datetime.utcnow() + timedelta(hours=2)},
        SECRET,
        algorithm="HS256"
    )

    return {"access_token": token}