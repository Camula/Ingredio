from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "super-tajny-klucz-ingredio"
ALGORITHM = "HS256"
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Błędny token")
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Błędny token")

def init_db():
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            name TEXT,
            quantity TEXT,
            unit TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

class Ingredient(BaseModel):
    name: str
    quantity: str
    unit: str

@app.get("/ingredients")
def get_ingredients(user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT name, quantity, unit FROM ingredients WHERE user_email = ?", (user_email,))
    items = cursor.fetchall()
    conn.close()
    return [dict(item) for item in items]

@app.post("/ingredients")
def add_ingredient(ingredient: Ingredient, user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ingredients WHERE user_email = ? AND name = ?", (user_email, ingredient.name))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Składnik już istnieje")
    
    cursor.execute("INSERT INTO ingredients (user_email, name, quantity, unit) VALUES (?, ?, ?, ?)",
                   (user_email, ingredient.name, ingredient.quantity, ingredient.unit))
    conn.commit()
    conn.close()
    return {"message": "Dodano"}

@app.put("/ingredients/{name}")
def update_ingredient(name: str, ingredient: Ingredient, user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE ingredients SET name = ?, quantity = ?, unit = ? WHERE user_email = ? AND name = ?",
                   (ingredient.name, ingredient.quantity, ingredient.unit, user_email, name))
    conn.commit()
    conn.close()
    return {"message": "Zaktualizowano"}

@app.delete("/ingredients/{name}")
def delete_ingredient(name: str, user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ingredients WHERE user_email = ? AND name = ?", (user_email, name))
    conn.commit()
    conn.close()
    return {"message": "Usunięto"}

@app.delete("/ingredients")
def clear_fridge(user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ingredients WHERE user_email = ?", (user_email,))
    conn.commit()
    conn.close()
    return {"message": "Wyczyszczono"}