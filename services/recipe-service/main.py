from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import sqlite3
import json
import jwt
from openai import OpenAI

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("API_KEY")
client = OpenAI(api_key=api_key) if api_key else None
SECRET = "ingredio_secret_key_2026_minimum_32_chars"

conn = sqlite3.connect("recipes.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    cache_key TEXT,
    data TEXT
)
""")

cursor.execute("PRAGMA table_info(recipes)")
existing_columns = {row[1] for row in cursor.fetchall()}

if "cache_key" not in existing_columns:
    cursor.execute("ALTER TABLE recipes ADD COLUMN cache_key TEXT DEFAULT ''")

conn.commit()

class Req(BaseModel):
    ingredients: list = []
    preferences: dict = {}

def clean(value):
    return str(value).strip() if value is not None else ""

def normalize(value):
    return clean(value).lower()

def ingredient_name(item):
    if isinstance(item, dict):
        return clean(item.get("name"))
    return clean(item)

def ingredient_quantity(item):
    if isinstance(item, dict):
        return clean(item.get("quantity"))
    return ""

def ingredient_unit(item):
    if isinstance(item, dict):
        return clean(item.get("unit"))
    return ""

def ingredient_prompt_name(item):
    return ingredient_name(item)

def ingredient_display(item):
    name = ingredient_name(item)
    quantity = ingredient_quantity(item)
    unit = ingredient_unit(item)
    parts = [name]
    if quantity:
        parts.append(quantity)
    if unit:
        parts.append(unit)
    return " ".join(parts).strip()

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

def build_cache_key(items, allow_extra, categories):
    payload = {
        "ingredients": sorted(
            list(
                set(
                    normalize(ingredient_prompt_name(item))
                    for item in items
                    if clean(ingredient_prompt_name(item))
                )
            )
        ),
        "allowExtra": bool(allow_extra),
        "categories": sorted([clean(c) for c in categories if clean(c)])
    }
    return json.dumps(payload, ensure_ascii=False, sort_keys=True)

def extract_json_array(text):
    if not text:
        raise HTTPException(status_code=500, detail="Pusta odpowiedź AI")

    start = text.find("[")
    end = text.rfind("]") + 1

    if start == -1 or end == 0:
        raise HTTPException(status_code=500, detail="Nieprawidłowy format odpowiedzi AI")

    raw = json.loads(text[start:end])

    if isinstance(raw, dict) and isinstance(raw.get("recipes"), list):
        raw = raw["recipes"]

    if not isinstance(raw, list):
        raise HTTPException(status_code=500, detail="Nieprawidłowy format odpowiedzi AI")

    return raw

def build_prompt(items, allow_extra, categories):
    ingredient_text = ", ".join(
        [ingredient_prompt_name(i) for i in items if clean(ingredient_prompt_name(i))]
    )

    category_text = ", ".join(categories) if categories else "dowolna"

    if allow_extra:
        return f"""
Wygeneruj po polsku dokładnie 3 różne przepisy.

Kategoria lub charakter przepisów: {category_text}.
Składniki użytkownika: {ingredient_text}.

Zasady:
- używaj dokładnych nazw składników
- ingredienty mają być krótkie i czytelne
- przepisy mają być różne od siebie
- możesz dodać brakujące składniki
- zwróć wyłącznie poprawny JSON
- nie dodawaj żadnego tekstu poza JSON

Format odpowiedzi:
[
  {{
    "title": "...",
    "ingredients": ["..."],
    "steps": ["..."]
  }},
  {{
    "title": "...",
    "ingredients": ["..."],
    "steps": ["..."]
  }},
  {{
    "title": "...",
    "ingredients": ["..."],
    "steps": ["..."]
  }}
]
"""
    return f"""
Wygeneruj po polsku dokładnie 3 różne przepisy.

Kategoria lub charakter przepisów: {category_text}.
Użyj tylko tych składników: {ingredient_text}.

Zasady:
- używaj dokładnych nazw składników
- ingredienty mają być krótkie i czytelne
- przepisy mają być różne od siebie
- nie dodawaj innych składników
- zwróć wyłącznie poprawny JSON
- nie dodawaj żadnego tekstu poza JSON

Format odpowiedzi:
[
  {{
    "title": "...",
    "ingredients": ["..."],
    "steps": ["..."]
  }},
  {{
    "title": "...",
    "ingredients": ["..."],
    "steps": ["..."]
  }},
  {{
    "title": "...",
    "ingredients": ["..."],
    "steps": ["..."]
  }}
]
"""

def sanitize_recipe(recipe, input_names, categories):
    if not isinstance(recipe, dict):
        return None

    title = clean(recipe.get("title"))
    ingredients = recipe.get("ingredients", [])
    steps = recipe.get("steps", [])

    if not title or not isinstance(ingredients, list) or not isinstance(steps, list):
        return None

    clean_ingredients = []
    for item in ingredients:
        value = clean(item)
        if value:
            clean_ingredients.append(value)

    clean_steps = []
    for step in steps:
        value = clean(step)
        if value:
            clean_steps.append(value)

    if not clean_ingredients or not clean_steps:
        return None

    missing = []
    for item in clean_ingredients:
        if normalize(item) not in input_names:
            missing.append(item)

    return {
        "title": title,
        "ingredients": clean_ingredients,
        "steps": clean_steps,
        "missing_ingredients": missing,
        "categories": categories
    }

@app.post("/recipe/generate")
def generate(req: Req):
    items = req.ingredients or []
    allow_extra = req.preferences.get("allowExtra", True)
    categories = req.preferences.get("categories", [])

    if isinstance(categories, str):
        categories = [categories] if clean(categories) else []

    cache_key = build_cache_key(items, allow_extra, categories)

    cursor.execute(
        "SELECT data FROM recipes WHERE email='cache' AND cache_key=? ORDER BY id DESC LIMIT 1",
        (cache_key,)
    )
    cached = cursor.fetchone()

    if cached:
        try:
            cached_data = json.loads(cached[0])
            if isinstance(cached_data, list):
                return cached_data
        except Exception:
            pass

    if not client:
        raise HTTPException(status_code=500, detail="Brak klucza API")

    prompt = build_prompt(items, allow_extra, categories)

    try:
        res = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9
        )
        text = res.choices[0].message.content
        raw_recipes = extract_json_array(text)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Błąd generowania przepisu")

    input_names = set(
        normalize(ingredient_prompt_name(item))
        for item in items
        if clean(ingredient_prompt_name(item))
    )

    sanitized = []
    for recipe in raw_recipes[:3]:
        cleaned = sanitize_recipe(recipe, input_names, categories)
        if cleaned:
            sanitized.append(cleaned)

    if len(sanitized) < 3:
        raise HTTPException(status_code=500, detail="AI nie zwróciło 3 poprawnych przepisów")

    cursor.execute(
        "DELETE FROM recipes WHERE email='cache' AND cache_key=?",
        (cache_key,)
    )
    cursor.execute(
        "INSERT INTO recipes (email, cache_key, data) VALUES (?, ?, ?)",
        ("cache", cache_key, json.dumps(sanitized, ensure_ascii=False))
    )
    conn.commit()

    return sanitized

@app.post("/recipe/save")
def save(data: dict, Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    recipe = data.get("recipe")

    if not recipe:
        raise HTTPException(status_code=400, detail="Brak przepisu")

    cursor.execute(
        "INSERT INTO recipes (email, cache_key, data) VALUES (?, ?, ?)",
        (email, "", json.dumps(recipe, ensure_ascii=False))
    )
    conn.commit()
    return {"ok": True}

@app.get("/recipe/saved")
def saved(Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    cursor.execute(
        "SELECT id, data FROM recipes WHERE email=? ORDER BY id DESC",
        (email,)
    )
    rows = cursor.fetchall()
    return [
        {
            "id": row[0],
            "recipe": json.loads(row[1])
        }
        for row in rows
    ]

@app.delete("/recipe/saved/{recipe_id}")
def delete_saved(recipe_id: int, Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    cursor.execute(
        "DELETE FROM recipes WHERE id=? AND email=?",
        (recipe_id, email)
    )
    conn.commit()
    return {"ok": True}