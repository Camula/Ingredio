from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
import jwt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET = "secret"

fridges = {}

def get_user_email(auth_header):
    token = auth_header.split(" ")[1]
    decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
    return decoded.get("email")

@app.post("/ingredients")
def add_ingredient(data: dict, Authorization: str = Header(None)):
    email = get_user_email(Authorization)

    if email not in fridges:
        fridges[email] = []

    fridges[email].append(data["name"])
    return {"message": "ok"}

@app.get("/ingredients")
def get_ingredients(Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    return fridges.get(email, [])

@app.delete("/ingredients/{name}")
def delete_ingredient(name: str, Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    if email in fridges and name in fridges[email]:
        fridges[email].remove(name)
    return {"message": "ok"}

@app.delete("/ingredients")
def clear_fridge(Authorization: str = Header(None)):
    email = get_user_email(Authorization)
    fridges[email] = []
    return {"message": "ok"}