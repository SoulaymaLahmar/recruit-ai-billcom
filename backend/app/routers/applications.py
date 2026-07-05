from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Application, Campaign, Candidate
from app.services.nlp import analyze_cv
from uuid import UUID
from typing import List
import shutil
import os

router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


# ─── POST /applications/apply ───────────
# Candidat dépose son CV sur une offre
@router.post("/apply/{campaign_id}")
async def apply_to_campaign(
    campaign_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Vérifier que la campagne existe
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Offre non trouvée")

    # Vérifier que c'est un PDF
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")

    # Sauvegarder le fichier
    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Analyser le CV
    cv_data = analyze_cv(file_path)

    # Créer ou récupérer le candidat
    existing = db.query(Candidate).filter(
        Candidate.email == cv_data.get("email")
    ).first()

    if existing:
        candidate = existing
    else:
        from app.models.models import CandidateSkill
        candidate = Candidate(
            name=cv_data.get("name") or "Inconnu",
            email=cv_data.get("email"),
            phone=cv_data.get("phone"),
            education=cv_data.get("education"),
            experience_years=cv_data.get("experience_years", 0),
            cv_path=file_path
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        # Sauvegarder les compétences
        for skill in cv_data.get("skills", []):
            db.add(CandidateSkill(
                candidate_id=candidate.id,
                skill_name=skill
            ))
        db.commit()

    # Vérifier si déjà candidaté
    existing_app = db.query(Application).filter(
        Application.candidate_id == candidate.id,
        Application.campaign_id == campaign_id
    ).first()

    if existing_app:
        raise HTTPException(status_code=400, detail="Vous avez déjà postulé à cette offre")

    # Créer la candidature
    application = Application(
        candidate_id=candidate.id,
        campaign_id=campaign_id,
        cv_path=file_path,
        status="En attente"
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Candidature déposée avec succès !",
        "application_id": str(application.id),
        "campaign": campaign.title,
        "candidate": candidate.name,
        "skills_detected": cv_data.get("skills", []),
        "status": "En attente"
    }


# ─── GET /applications/campaign/{id} ────
# Recruteur voit les candidatures d'une offre
@router.get("/campaign/{campaign_id}")
def get_campaign_applications(campaign_id: UUID, db: Session = Depends(get_db)):
    applications = db.query(Application).filter(
        Application.campaign_id == campaign_id
    ).all()

    result = []
    for app in applications:
        candidate = db.query(Candidate).filter(
            Candidate.id == app.candidate_id
        ).first()
        campaign = db.query(Campaign).filter(
            Campaign.id == app.campaign_id
        ).first()
        result.append({
            "application_id": str(app.id),
            "candidate_name": candidate.name if candidate else "Inconnu",
            "candidate_email": candidate.email if candidate else "—",
            "campaign_title": campaign.title if campaign else "—",
            "status": app.status,
            "applied_at": str(app.applied_at)
        })

    return {"total": len(result), "applications": result}


# ─── GET /applications/all ──────────────
# Toutes les candidatures
@router.get("/all")
def get_all_applications(db: Session = Depends(get_db)):
    applications = db.query(Application).all()
    result = []
    for app in applications:
        candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
        campaign = db.query(Campaign).filter(Campaign.id == app.campaign_id).first()
        result.append({
            "application_id": str(app.id),
            "candidate_name": candidate.name if candidate else "Inconnu",
            "campaign_title": campaign.title if campaign else "—",
            "status": app.status,
            "applied_at": str(app.applied_at)
        })
    return {"total": len(result), "applications": result}


# ─── PUT /applications/{id}/status ──────
# Recruteur met à jour le statut
@router.put("/{application_id}/status")
def update_status(
    application_id: UUID,
    status: str,
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Candidature non trouvée")

    valid_statuses = ["En attente", "En cours d'examen", "Accepté", "Refusé"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs: {valid_statuses}")

    app.status = status
    db.commit()
    return {"message": f"Statut mis à jour : {status}"}