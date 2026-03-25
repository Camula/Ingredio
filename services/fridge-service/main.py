from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "secret"
ALGORITHM = "HS256"

ingredients_db = {}

class Ingredient(BaseModel):
    name: str

def get_user_email(authorization: str = Header(None, alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Brak tokena")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["email"]
    except:
        raise HTTPException(status_code=401, detail="Nieprawidłowy token")

@app.get("/ingredients")
def get_ingredients(authorization: str = Header(None, alias="Authorization")):
    email = get_user_email(authorization)
    return ingredients_db.get(email, [])

@app.post("/ingredients")
def add_ingredient(item: Ingredient, authorization: str = Header(None, alias="Authorization")):
    email = get_user_email(authorization)
    if email not in ingredients_db:
        ingredients_db[email] = []
    ingredients_db[email].append(item.name)
    return {"message": "Dodano składnik"}

@app.delete("/ingredients/{name}")
def delete_ingredient(name: str, authorization: str = Header(None, alias="Authorization")):
    email = get_user_email(authorization)
    if email not in ingredients_db or name not in ingredients_db[email]:
        raise HTTPException(status_code=404, detail="Nie znaleziono składnika")
    ingredients_db[email].remove(name)
    return {"message": "Usunięto składnik"}