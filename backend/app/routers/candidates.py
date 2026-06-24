from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Candidate
from app.schemas.schemas import CandidateCreate, CandidateResponse
from typing import List
from uuid import UUID

router = APIRouter(
    prefix="/candidates",
    tags=["Candidates"]
)


#  GET /candidates 
# Retourne tous les candidats
@router.get("/", response_model=List[CandidateResponse])
def get_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    return candidates


#  GET /candidates/{id} 
# Retourne un candidat par son ID
@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: UUID, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")
    return candidate


#  POST /candidates 
# Crée un nouveau candidat
@router.post("/", response_model=CandidateResponse)
def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    new_candidate = Candidate(
        name=candidate.name,
        email=candidate.email,
        phone=candidate.phone,
        education=candidate.education,
        experience_years=candidate.experience_years
    )
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)
    return new_candidate


#  DELETE /candidates/{id} 
# Supprime un candidat
@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: UUID, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")
    db.delete(candidate)
    db.commit()
    return {"message": "Candidat supprimé avec succès"}