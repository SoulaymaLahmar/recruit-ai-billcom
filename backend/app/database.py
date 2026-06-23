from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import time

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://recrut:recrut123@db:5432/recrut_db")

# Attendre que PostgreSQL soit prêt
def get_engine():
    retries = 5
    while retries > 0:
        try:
            engine = create_engine(DATABASE_URL)
            engine.connect()
            print("✅ Connecté à PostgreSQL !")
            return engine
        except Exception as e:
            print(f"⏳ PostgreSQL pas encore prêt... ({retries} essais restants)")
            retries -= 1
            time.sleep(3)
    raise Exception("❌ Impossible de se connecter à PostgreSQL")

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()