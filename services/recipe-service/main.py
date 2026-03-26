from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
import json
import jwt

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

saved_recipes = {}

BASIC_INGREDIENTS = ["sól", "pieprz", "oliwa", "olej", "masło", "cukier"]

class RecipeRequest(BaseModel):
    ingredients: list[str]
    preferences: dict = {}

class SaveRecipeRequest(BaseModel):
    recipe: dict

def get_user_email(auth_header):
    if not auth_header:
        return None
    token = auth_header.split(" ")[1]
    decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
    return decoded.get("email")

@app.post("/recipe/generate")
def generate_recipe(req: RecipeRequest):
    if not req.ingredients:
        return {"error": "Brak składników"}

    allow_extra = req.preferences.get("allowExtra", True)

    if allow_extra:
        extra_text = "Możesz dodać inne składniki."
    else:
        extra_text = "Użyj TYLKO podanych składników. Możesz używać przypraw typu sól, pieprz, olej."

    prompt = f"""
Składniki użytkownika: {", ".join(req.ingredients)}.

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

        missing = [
            i for i in recipe_set
            if i not in user_set and i not in BASIC_INGREDIENTS
        ]

        recipe["missing_ingredients"] = missing

        return recipe

    except Exception as e:
        return {"error": str(e)}

@app.post("/recipe/save")
def save_recipe(req: SaveRecipeRequest, Authorization: str = Header(None)):
    email = get_user_email(Authorization)

    if email not in saved_recipes:
        saved_recipes[email] = []

    saved_recipes[email].append(req.recipe)
    return {"message": "ok"}

@app.get("/recipe/saved")
def get_saved(Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    return saved_recipes.get(email, [])

@app.delete("/recipe/saved/{index}")
def delete_saved(index: int, Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    if email in saved_recipes and index < len(saved_recipes[email]):
        saved_recipes[email].pop(index)
    return {"message": "ok"}