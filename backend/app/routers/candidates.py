from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Candidate, CandidateSkill, CandidateScore, Recommendation

from app.schemas.schemas import CandidateCreate, CandidateResponse
from app.services.nlp import analyze_cv
from typing import List
from uuid import UUID
import shutil
import os

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

# ─── POST /candidates/upload ────────────
# Upload un CV PDF et extrait les données
@router.post("/upload")
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Vérifier que c'est bien un PDF
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")

    # 2. Sauvegarder le fichier
    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. Analyser le CV avec NLP
    cv_data = analyze_cv(file_path)

    if "error" in cv_data:
        raise HTTPException(status_code=422, detail=cv_data["error"])

    # 4. Créer le candidat en base
    new_candidate = Candidate(
        name=cv_data["name"] or "Inconnu",
        email=cv_data["email"],
        phone=cv_data["phone"],
        education=cv_data["education"],
        experience_years=cv_data["experience_years"],
        cv_path=file_path
    )
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)

    # 5. Sauvegarder les compétences
    for skill in cv_data["skills"]:
        candidate_skill = CandidateSkill(
            candidate_id=new_candidate.id,
            skill_name=skill
        )
        db.add(candidate_skill)
    db.commit()

    return {
        "message": "CV analysé avec succès",
        "candidate": {
            "id": str(new_candidate.id),
            "name": new_candidate.name,
            "email": new_candidate.email,
            "education": new_candidate.education,
            "experience_years": new_candidate.experience_years,
            "skills_extracted": cv_data["skills"]
        }
    }

# GET /candidates/{id}/skills
@router.get("/{candidate_id}/skills")
def get_candidate_skills(candidate_id: UUID, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")
    
    skills = db.query(CandidateSkill).filter(
        CandidateSkill.candidate_id == candidate_id
    ).all()
    
    return {
        "candidate_name": candidate.name,
        "candidate_id": str(candidate_id),
        "skills": [skill.skill_name for skill in skills],
        "total_skills": len(skills)
    }
# GET /candidates/{id}/profile
@router.get("/{candidate_id}/profile")
def get_candidate_profile(candidate_id: UUID, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")

    skills = db.query(CandidateSkill).filter(
        CandidateSkill.candidate_id == candidate_id
    ).all()

    scores = db.query(CandidateScore).filter(
        CandidateScore.candidate_id == candidate_id
    ).all()

    recommendations = db.query(Recommendation).filter(
        Recommendation.candidate_id == candidate_id
    ).all()

    return {
        "id": str(candidate.id),
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "education": candidate.education,
        "experience_years": candidate.experience_years,
        "cv_path": candidate.cv_path,
        "skills": [skill.skill_name for skill in skills],
        "scores": [
            {
                "campaign_id": str(s.campaign_id),
                "skill_score": s.skill_score,
                "experience_score": s.experience_score,
                "education_score": s.education_score,
                "final_score": s.final_score
            } for s in scores
        ],
        "recommendations": [
            {
                "campaign_id": str(r.campaign_id),
                "recommendation": r.recommendation,
                "reason": r.reason
            } for r in recommendations
        ]
    }
