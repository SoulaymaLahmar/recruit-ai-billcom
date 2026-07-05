from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import (
    Candidate, CandidateSkill, CandidateScore,
    Recommendation, Application, Campaign
)
from app.schemas.schemas import CandidateCreate, CandidateResponse
from app.services.nlp import analyze_cv
from typing import List
from uuid import UUID
import shutil
import os
import re

router = APIRouter(
    prefix="/candidates",
    tags=["Candidates"]
)


# ─── GET /candidates ────────────────────
@router.get("/", response_model=List[CandidateResponse])
def get_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).all()


# ─── POST /candidates ───────────────────
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


# ─── POST /candidates/upload ────────────
@router.post("/upload")
async def upload_cv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")

    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    cv_data = analyze_cv(file_path)

    if "error" in cv_data:
        raise HTTPException(status_code=422, detail=cv_data["error"])

    # Nettoyer l'email si mal extrait
    raw_email = cv_data.get("email") or ""
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_email)
    clean_email = email_match.group(0) if email_match else None

    new_candidate = Candidate(
        name=cv_data.get("name") or "Inconnu",
        email=clean_email,
        phone=cv_data.get("phone"),
        education=cv_data.get("education"),
        experience_years=cv_data.get("experience_years", 0),
        cv_path=file_path
    )
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)

    for skill in cv_data.get("skills", []):
        db.add(CandidateSkill(
            candidate_id=new_candidate.id,
            skill_name=skill
        ))
    db.commit()

    return {
        "message": "CV analysé avec succès",
        "candidate": {
            "id": str(new_candidate.id),
            "name": new_candidate.name,
            "email": new_candidate.email,
            "education": new_candidate.education,
            "experience_years": new_candidate.experience_years,
            "skills_extracted": cv_data.get("skills", [])
        }
    }


# ─── GET /candidates/{id}/skills ────────
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
        "skills": [s.skill_name for s in skills],
        "total_skills": len(skills)
    }


# ─── GET /candidates/{id}/profile ───────
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

    applications = db.query(Application).filter(
        Application.candidate_id == candidate_id
    ).all()

    app_list = []
    for app in applications:
        campaign = db.query(Campaign).filter(Campaign.id == app.campaign_id).first()
        app_list.append({
            "application_id": str(app.id),
            "campaign_id": str(app.campaign_id),
            "campaign_title": campaign.title if campaign else "—",
            "status": app.status,
            "applied_at": str(app.applied_at)
        })

    # Enrichir les scores avec le titre de la campagne
    scores_list = []
    for s in scores:
        campaign = db.query(Campaign).filter(Campaign.id == s.campaign_id).first()
        scores_list.append({
            "campaign_id": str(s.campaign_id),
            "campaign_title": campaign.title if campaign else "—",
            "skill_score": s.skill_score,
            "experience_score": s.experience_score,
            "education_score": s.education_score,
            "final_score": s.final_score
        })

    # Enrichir les recommandations avec le titre de la campagne
    recs_list = []
    for r in recommendations:
        campaign = db.query(Campaign).filter(Campaign.id == r.campaign_id).first()
        recs_list.append({
            "campaign_id": str(r.campaign_id),
            "campaign_title": campaign.title if campaign else "—",
            "recommendation": r.recommendation,
            "reason": r.reason
        })

    return {
        "id": str(candidate.id),
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "education": candidate.education,
        "experience_years": candidate.experience_years,
        "cv_path": candidate.cv_path,
        "skills": [s.skill_name for s in skills],
        "scores": scores_list,
        "recommendations": recs_list,
        "applications": app_list
    }


# ─── GET /candidates/{id} ───────────────
@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: UUID, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")
    return candidate


# ─── DELETE /candidates/{id} ────────────
@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: UUID, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")

    db.query(CandidateSkill).filter(CandidateSkill.candidate_id == candidate_id).delete()
    db.query(CandidateScore).filter(CandidateScore.candidate_id == candidate_id).delete()
    db.query(Recommendation).filter(Recommendation.candidate_id == candidate_id).delete()
    db.query(Application).filter(Application.candidate_id == candidate_id).delete()

    db.delete(candidate)
    db.commit()
    return {"message": "Candidat supprimé avec succès"}