# Les schemas définissent le **format des données** qui entrent et sortent de l'API.

from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# SCHEMAS CAMPAIGN

class CampaignCreate(BaseModel):
    title: str
    description: Optional[str] = None
    required_skills: Optional[list] = []

class CampaignResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    required_skills: Optional[list]
    created_at: datetime

    class Config:
        from_attributes = True


# SCHEMAS CANDIDATE

class CandidateCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[str] = None
    experience_years: Optional[int] = 0

class CandidateResponse(BaseModel):
    id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    education: Optional[str]
    experience_years: Optional[int]
    cv_path: Optional[str]

    class Config:
        from_attributes = True


# SCHEMAS USER

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True