from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import jwt
import os
import json
import traceback
from typing import List, Dict, Any
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

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
    conn = sqlite3.connect("recipes.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            recipe_data TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

class Preferences(BaseModel):
    allowExtra: bool
    categories: List[str]
    mainIngredient: str

class GenerateRequest(BaseModel):
    ingredients: List[Dict[str, str]]
    preferences: Preferences

class SaveRequest(BaseModel):
    recipe: Dict[str, Any]

@app.post("/recipe/generate")
def generate_recipe(request: GenerateRequest, user_email: str = Depends(get_current_user)):
    api_key = os.getenv("API_KEY")
    if not api_key:
        print("BRAK KLUCZA API W PLIKU ENV!")
        raise HTTPException(status_code=500, detail="Brak klucza API. Sprawdź plik .env")

    ingredients_list = ", ".join([f"{item['name']} ({item['quantity']} {item['unit']})" for item in request.ingredients])
    
    prompt = f"Wygeneruj 2 przepisy kulinarne w formacie JSON.\n"
    prompt += f"Posiadam składniki: {ingredients_list}.\n"
    if request.preferences.mainIngredient:
        prompt += f"Główny składnik to: {request.preferences.mainIngredient}.\n"
    if not request.preferences.allowExtra:
        prompt += "Użyj TYLKO tych składników.\n"
    if request.preferences.categories:
        prompt += f"Kategorie/tagi: {', '.join(request.preferences.categories)}.\n"
        
    prompt += """Zwróć TYLKO czystą tablicę JSON, bez żadnego tekstu wprowadzającego.
    Format JSON to tablica 2 obiektów, każdy obiekt ma mieć klucze:
    "title" (string),
    "ingredients" (tablica stringów z ilościami),
    "steps" (tablica stringów z instrukcjami),
    "categories" (tablica stringów z tagami)."""

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        content = response.choices[0].message.content
        
        print(f"--- ODPOWIEDŹ AI ---\n{content}\n--------------------")
        
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        
        if start_idx != -1 and end_idx != 0:
            clean_json = content[start_idx:end_idx]
        else:
            clean_json = content

        recipes = json.loads(clean_json)
        return recipes
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Błąd przetwarzania odpowiedzi od AI. Zobacz logi serwera.")

@app.get("/recipe/saved")
def get_saved_recipes(user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("recipes.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, recipe_data FROM saved_recipes WHERE user_email = ?", (user_email,))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for row in rows:
        data = json.loads(row["recipe_data"])
        data["id"] = row["id"]
        results.append(data)
    return results

@app.post("/recipe/save")
def save_recipe(request: SaveRequest, user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("recipes.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO saved_recipes (user_email, recipe_data) VALUES (?, ?)", 
                   (user_email, json.dumps(request.recipe)))
    conn.commit()
    conn.close()
    return {"message": "Zapisano"}

@app.delete("/recipe/saved/{recipe_id}")
def delete_saved_recipe(recipe_id: int, user_email: str = Depends(get_current_user)):
    conn = sqlite3.connect("recipes.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_recipes WHERE id = ? AND user_email = ?", (recipe_id, user_email))
    conn.commit()
    conn.close()
    return {"message": "Usunięto"}