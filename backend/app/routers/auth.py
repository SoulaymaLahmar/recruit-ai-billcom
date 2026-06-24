from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse
from app.services.auth import hash_password, authenticate_user, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentification"]
)


# POST /auth/register
@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Un utilisateur avec cet email existe déjà"
        )
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role="recruiter"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# POST /auth/login
@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    token = create_access_token(data={
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": user.name,
        "user_role": user.role
    }
