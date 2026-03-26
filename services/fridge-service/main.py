from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
import jwt
import sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET = "secret"

conn = sqlite3.connect("fridge.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    name TEXT
)
""")
conn.commit()

def get_user_email(auth_header):
    token = auth_header.split(" ")[1]
    decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
    return decoded.get("email")

@app.post("/ingredients")
def add_ingredient(data: dict, Authorization: str = Header(None)):
    email = get_user_email(Authorization)

    cursor.execute(
        "INSERT INTO ingredients (email, name) VALUES (?, ?)",
        (email, data["name"])
    )
    conn.commit()

    return {"message": "ok"}

@app.get("/ingredients")
def get_ingredients(Authorization: str = Header(None)):
    email = get_user_email(Authorization)

    cursor.execute(
        "SELECT name FROM ingredients WHERE email=?",
        (email,)
    )

    rows = cursor.fetchall()
    return [r[0] for r in rows]

@app.delete("/ingredients/{name}")
def delete_ingredient(name: str, Authorization: str = Header(None)):
    email = get_user_email(Authorization)

    cursor.execute(
        "DELETE FROM ingredients WHERE email=? AND name=?",
        (email, name)
    )
    conn.commit()

    return {"message": "ok"}

@app.delete("/ingredients")
def clear_fridge(Authorization: str = Header(None)):
    email = get_user_email(Authorization)

    cursor.execute(
        "DELETE FROM ingredients WHERE email=?",
        (email,)
    )
    conn.commit()

    return {"message": "ok"}