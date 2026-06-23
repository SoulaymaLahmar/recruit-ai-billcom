from fastapi import FastAPI

app = FastAPI(title="RecrutIA API", version="1.0.0")

@app.get("/")
def root():
    return {"message": "RecrutIA API is running 🚀"}