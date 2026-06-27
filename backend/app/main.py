from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import models
from app.routers import campaigns, candidates, users, scores, recommendations, auth, scoring

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RecrutIA API")

# ─── CORS ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(campaigns.router)
app.include_router(candidates.router)
app.include_router(users.router)
app.include_router(scores.router)
app.include_router(recommendations.router)
app.include_router(scoring.router)

@app.get("/")
def root():
    return {"message": "RecrutIA API is running 🚀"}