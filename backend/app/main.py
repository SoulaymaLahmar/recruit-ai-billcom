from fastapi import FastAPI
from app.database import engine, Base
from app.models import models

# Crée toutes les tables automatiquement au démarrage
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RecrutIA API", version="1.0.0")

@app.get("/")
def root():
    return {"message": "RecrutIA API is running 🚀"}