from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import jwt
from typing import List, Optional
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
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shopping_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            name TEXT,
            quantity TEXT,
            unit TEXT,
            is_bought INTEGER DEFAULT 0,
            source TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

class Ingredient(BaseModel):
    name: str
    quantity: str
    unit: str

class ShoppingItemCreate(BaseModel):
    name: str
    quantity: str
    unit: str
    source: Optional[str] = ""

class ShoppingItemUpdate(BaseModel):
    name: str
    quantity: str
    unit: str
    is_bought: int

# --- FRIDGE ENDPOINTS ---

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


# --- SHOPPING LIST ENDPOINTS ---

@app.get("/shopping")
def get_shopping_list(user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, quantity, unit, is_bought, source FROM shopping_list WHERE user_email = ?", (user_email,))
    items = cursor.fetchall()
    conn.close()
    return [dict(item) for item in items]

@app.post("/shopping")
def add_shopping_item(item: ShoppingItemCreate, user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, source FROM shopping_list WHERE user_email = ? AND name = ?", (user_email, item.name))
    row = cursor.fetchone()
    
    if row:
        item_id, existing_source = row
        new_source = existing_source or ""
        if item.source and item.source not in new_source:
            new_source = f"{new_source}, {item.source}" if new_source else item.source
        cursor.execute("UPDATE shopping_list SET quantity = ?, unit = ?, source = ?, is_bought = 0 WHERE id = ?", 
                       (item.quantity, item.unit, new_source, item_id))
    else:
        cursor.execute("INSERT INTO shopping_list (user_email, name, quantity, unit, is_bought, source) VALUES (?, ?, ?, ?, 0, ?)",
                       (user_email, item.name, item.quantity, item.unit, item.source or ""))
    conn.commit()
    conn.close()
    return {"message": "Dodano na listę zakupów"}

@app.post("/shopping/bulk")
def add_shopping_items_bulk(items: List[ShoppingItemCreate], user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    for item in items:
        cursor.execute("SELECT id, source FROM shopping_list WHERE user_email = ? AND name = ?", (user_email, item.name))
        row = cursor.fetchone()
        if row:
            item_id, existing_source = row
            new_source = existing_source or ""
            if item.source and item.source not in new_source:
                new_source = f"{new_source}, {item.source}" if new_source else item.source
            cursor.execute("UPDATE shopping_list SET source = ?, is_bought = 0 WHERE id = ?", (new_source, item_id))
        else:
            cursor.execute("INSERT INTO shopping_list (user_email, name, quantity, unit, is_bought, source) VALUES (?, ?, ?, ?, 0, ?)",
                           (user_email, item.name, item.quantity, item.unit, item.source or ""))
    conn.commit()
    conn.close()
    return {"message": "Dodano składniki masowo"}

@app.put("/shopping/{item_id}")
def update_shopping_item(item_id: int, item: ShoppingItemUpdate, user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE shopping_list SET name = ?, quantity = ?, unit = ?, is_bought = ? WHERE id = ? AND user_email = ?",
                   (item.name, item.quantity, item.unit, item.is_bought, item_id, user_email))
    conn.commit()
    conn.close()
    return {"message": "Zaktualizowano"}

@app.delete("/shopping/bought")
def delete_bought_items(user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shopping_list WHERE user_email = ? AND is_bought = 1", (user_email,))
    conn.commit()
    conn.close()
    return {"message": "Usunięto kupione"}

@app.delete("/shopping/all")
def clear_shopping_list(user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shopping_list WHERE user_email = ?", (user_email,))
    conn.commit()
    conn.close()
    return {"message": "Wyczyszczono listę zakupów"}

@app.delete("/shopping/{item_id}")
def delete_shopping_item(item_id: int, user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shopping_list WHERE id = ? AND user_email = ?", (item_id, user_email))
    conn.commit()
    conn.close()
    return {"message": "Usunięto"}

@app.post("/shopping/move-to-fridge")
def move_bought_to_fridge(user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("fridge.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name, quantity, unit FROM shopping_list WHERE user_email = ? AND is_bought = 1", (user_email,))
    bought_items = cursor.fetchall()
    
    for item in bought_items:
        name, quantity, unit = item
        cursor.execute("SELECT * FROM ingredients WHERE user_email = ? AND name = ?", (user_email, name))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO ingredients (user_email, name, quantity, unit) VALUES (?, ?, ?, ?)", 
                           (user_email, name, quantity, unit))
            
    cursor.execute("DELETE FROM shopping_list WHERE user_email = ? AND is_bought = 1", (user_email,))
    conn.commit()
    conn.close()
    return {"message": "Przeniesiono kupione do lodówki"}