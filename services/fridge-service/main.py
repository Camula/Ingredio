from fastapi import FastAPI, Header, HTTPException
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

SECRET = "ingredio_secret_key_2026_minimum_32_chars"

conn = sqlite3.connect("fridge.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    name TEXT,
    name_key TEXT,
    quantity TEXT,
    unit TEXT
)
""")

cursor.execute("PRAGMA table_info(ingredients)")
existing_columns = {row[1] for row in cursor.fetchall()}

if "name_key" not in existing_columns:
    cursor.execute("ALTER TABLE ingredients ADD COLUMN name_key TEXT")
if "quantity" not in existing_columns:
    cursor.execute("ALTER TABLE ingredients ADD COLUMN quantity TEXT")
if "unit" not in existing_columns:
    cursor.execute("ALTER TABLE ingredients ADD COLUMN unit TEXT")

cursor.execute(
    "UPDATE ingredients SET name_key = LOWER(TRIM(name)) WHERE name_key IS NULL OR name_key = ''"
)
conn.commit()

def clean(value):
    return str(value).strip() if value is not None else ""

def normalize(value):
    return clean(value).lower()

def get_user_email(auth_header):
    if not auth_header or " " not in auth_header:
        raise HTTPException(status_code=401, detail="Brak tokena")
    token = auth_header.split(" ", 1)[1]
    try:
        decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Błędny token")
    email = decoded.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Błędny token")
    return email

def row_to_item(row):
    return {
        "name": row[0],
        "quantity": row[1] or "",
        "unit": row[2] or ""
    }

@app.post("/ingredients")
def add_ingredient(data: dict, Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    name = clean(data.get("name"))
    quantity = clean(data.get("quantity"))
    unit = clean(data.get("unit"))
    name_key = normalize(name)

    if not name_key:
        raise HTTPException(status_code=400, detail="Pusty składnik")

    cursor.execute(
        "SELECT id FROM ingredients WHERE email=? AND name_key=?",
        (email, name_key)
    )
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Składnik już istnieje")

    cursor.execute(
        "INSERT INTO ingredients (email, name, name_key, quantity, unit) VALUES (?, ?, ?, ?, ?)",
        (email, name, name_key, quantity, unit)
    )
    conn.commit()
    return {"message": "ok"}

@app.get("/ingredients")
def get_ingredients(Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    cursor.execute(
        "SELECT name, quantity, unit FROM ingredients WHERE email=? ORDER BY id DESC",
        (email,)
    )
    return [row_to_item(r) for r in cursor.fetchall()]

@app.put("/ingredients/{name}")
def edit_ingredient(name: str, data: dict, Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    old_key = normalize(name)

    new_name = clean(data.get("name"))
    new_quantity = clean(data.get("quantity"))
    new_unit = clean(data.get("unit"))
    new_key = normalize(new_name)

    if not new_key:
        raise HTTPException(status_code=400, detail="Pusty składnik")

    cursor.execute(
        "SELECT id FROM ingredients WHERE email=? AND name_key=?",
        (email, old_key)
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Nie znaleziono składnika")

    if new_key != old_key:
        cursor.execute(
            "SELECT id FROM ingredients WHERE email=? AND name_key=?",
            (email, new_key)
        )
        other = cursor.fetchone()
        if other:
            raise HTTPException(status_code=400, detail="Składnik już istnieje")

    cursor.execute(
        "UPDATE ingredients SET name=?, name_key=?, quantity=?, unit=? WHERE email=? AND name_key=?",
        (new_name, new_key, new_quantity, new_unit, email, old_key)
    )
    conn.commit()
    return {"message": "ok"}

@app.delete("/ingredients/{name}")
def delete_ingredient(name: str, Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    name_key = normalize(name)
    cursor.execute(
        "DELETE FROM ingredients WHERE email=? AND name_key=?",
        (email, name_key)
    )
    conn.commit()
    return {"message": "ok"}

@app.delete("/ingredients")
def clear(Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    cursor.execute("DELETE FROM ingredients WHERE email=?", (email,))
    conn.commit()
    return {"message": "ok"}