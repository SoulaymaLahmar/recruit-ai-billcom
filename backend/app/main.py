from fastapi import FastAPI
from app.database import engine, Base
from app.models import models
from app.routers import campaigns, candidates, users, scores, recommendations, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RecrutIA API", version="1.0.0")

app.include_router(auth.router)
app.include_router(campaigns.router)
app.include_router(candidates.router)
app.include_router(users.router)
app.include_router(scores.router)
app.include_router(recommendations.router)

@app.get("/")
def root():
    return {"message": "RecrutIA API is running 🚀"}