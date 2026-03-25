from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
import json
from dotenv import load_dotenv
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

class RecipeRequest(BaseModel):
    ingredients: list[str]
    preferences: dict = {}

@app.post("/recipe/generate")
def generate_recipe(req: RecipeRequest):
    try:
        prompt = f"""
Użytkownik ma składniki: {", ".join(req.ingredients)}.

Zwróć TYLKO JSON bez żadnego tekstu.

Format:
{{
  "title": "...",
  "ingredients": ["..."],
  "steps": ["..."],
  "estimated_time": "...",
  "difficulty": "..."
}}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Jesteś kucharzem. Zawsze zwracasz czysty JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        text = response.choices[0].message.content

        return json.loads(text)

    except Exception as e:
        return {"error": str(e)}