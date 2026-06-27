from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Candidate, Campaign, CandidateScore
from app.services.scoring import score_candidate
from typing import List
from uuid import UUID

router = APIRouter(
    prefix="/scoring",
    tags=["Scoring IA"]
)


# ─── POST /scoring/{candidate_id}/{campaign_id} ──
# Calculer le score d'un candidat pour une campagne
@router.post("/{candidate_id}/{campaign_id}")
def calculate_score(
    candidate_id: UUID,
    campaign_id: UUID,
    required_exp: int = 1,
    db: Session = Depends(get_db)
):
    result = score_candidate(db, str(candidate_id), str(campaign_id), required_exp)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ─── GET /scoring/rankings/{campaign_id} ────────
# Classement des candidats pour une campagne
@router.get("/rankings/{campaign_id}")
def get_rankings(campaign_id: UUID, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")

    scores = db.query(CandidateScore).filter(
        CandidateScore.campaign_id == campaign_id
    ).order_by(CandidateScore.final_score.desc()).all()

    rankings = []
    for i, score in enumerate(scores):
        candidate = db.query(Candidate).filter(
            Candidate.id == score.candidate_id
        ).first()
        rankings.append({
            "rank": i + 1,
            "candidate_id": str(score.candidate_id),
            "candidate_name": candidate.name if candidate else "Inconnu",
            "skill_score": score.skill_score,
            "experience_score": score.experience_score,
            "education_score": score.education_score,
            "final_score": score.final_score
        })

    return {
        "campaign": campaign.title,
        "total_candidates": len(rankings),
        "rankings": rankings
    }


# ─── POST /scoring/campaign/{campaign_id} ───────
# Scorer tous les candidats pour une campagne
@router.post("/campaign/{campaign_id}")
def score_all_candidates(
    campaign_id: UUID,
    required_exp: int = 1,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")

    candidates = db.query(Candidate).all()
    results = []

    for candidate in candidates:
        result = score_candidate(
            db,
            str(candidate.id),
            str(campaign_id),
            required_exp
        )
        if "error" not in result:
            results.append(result)

    results.sort(key=lambda x: x["final_score"], reverse=True)

    return {
        "campaign": campaign.title,
        "total_scored": len(results),
        "results": results
    }