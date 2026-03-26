from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
import json
import jwt
import sqlite3

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("API_KEY"))

SECRET = "secret"

conn = sqlite3.connect("recipes.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    data TEXT
)
""")
conn.commit()

class RecipeRequest(BaseModel):
    ingredients: list[str]
    preferences: dict = {}

class SaveRecipeRequest(BaseModel):
    recipe: dict

def get_user_email(auth_header):
    token = auth_header.split(" ")[1]
    decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
    return decoded.get("email")

@app.post("/recipe/generate")
def generate_recipe(req: RecipeRequest):
    if not req.ingredients:
        return {"error": "Brak składników"}

    allow_extra = req.preferences.get("allowExtra", True)

    extra_text = "Możesz dodać inne składniki." if allow_extra else "Użyj tylko podanych składników + przyprawy"

    prompt = f"""
Składniki: {", ".join(req.ingredients)}
{extra_text}

Zwróć JSON:
{{
  "title": "...",
  "ingredients": ["..."],
  "steps": ["..."],
  "estimated_time": "...",
  "difficulty": "..."
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Jesteś kucharzem."},
                {"role": "user", "content": prompt}
            ]
        )

        text = response.choices[0].message.content
        start = text.find("{")
        end = text.rfind("}") + 1
        recipe = json.loads(text[start:end])

        user_set = set(i.lower() for i in req.ingredients)
        recipe_set = set(i.lower() for i in recipe.get("ingredients", []))

        recipe["missing_ingredients"] = list(recipe_set - user_set)

        return recipe

    except Exception as e:
        return {"error": str(e)}

@app.post("/recipe/save")
def save_recipe(req: SaveRecipeRequest, Authorization: str = Header(None)):
    email = get_user_email(Authorization)

    cursor.execute(
        "INSERT INTO recipes (email, data) VALUES (?, ?)",
        (email, json.dumps(req.recipe))
    )
    conn.commit()

    return {"message": "ok"}

@app.get("/recipe/saved")
def get_saved(Authorization: str = Header(None)):
    email = get_user_email(Authorization)

    cursor.execute(
        "SELECT data FROM recipes WHERE email=?",
        (email,)
    )

    rows = cursor.fetchall()

    return [json.loads(r[0]) for r in rows]

@app.delete("/recipe/saved/{index}")
def delete_saved(index: int, Authorization: str = Header(None)):
    email = get_user_email(Authorization)

    cursor.execute(
        "SELECT id FROM recipes WHERE email=?",
        (email,)
    )
    rows = cursor.fetchall()

    if index < len(rows):
        recipe_id = rows[index][0]
        cursor.execute("DELETE FROM recipes WHERE id=?", (recipe_id,))
        conn.commit()

    return {"message": "ok"}