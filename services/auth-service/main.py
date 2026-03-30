from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext

app = FastAPI(title="Auth Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "super-tajny-klucz-ingredio"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    conn = sqlite3.connect("auth.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            hashed_password TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

class User(BaseModel):
    email: str
    password: str

def get_db_connection():
    conn = sqlite3.connect("auth.db")
    conn.row_factory = sqlite3.Row
    return conn

@app.post("/auth/register")
def register(user: User):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Użytkownik o tym adresie email już istnieje")
    
    hashed_pw = pwd_context.hash(user.password)
    cursor.execute("INSERT INTO users (email, hashed_password) VALUES (?, ?)", (user.email, hashed_pw))
    conn.commit()
    conn.close()
    return {"message": "Zarejestrowano pomyślnie"}

@app.post("/auth/login")
def login(user: User):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (user.email,))
    db_user = cursor.fetchone()
    conn.close()
    
    if not db_user or not pwd_context.verify(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Błędny email lub hasło")
        
    expire = datetime.utcnow() + timedelta(hours=24)
    token_data = {"sub": user.email, "exp": expire}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}