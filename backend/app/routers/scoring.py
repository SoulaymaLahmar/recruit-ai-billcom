from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Candidate, Campaign, CandidateScore
from app.services.scoring import score_candidate
from uuid import UUID

router = APIRouter(
    prefix="/scoring",
    tags=["Scoring IA"]
)


# ─── POST /scoring/campaign/{campaign_id} ───
# DOIT ÊTRE AVANT /{candidate_id}/{campaign_id}
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
    if not candidates:
        return {
            "campaign": campaign.title,
            "total_scored": 0,
            "results": [],
            "message": "Aucun candidat dans la base"
        }

    results = []
    for candidate in candidates:
        result = score_candidate(
            db, str(candidate.id), str(campaign_id), required_exp
        )
        if "error" not in result:
            results.append(result)

    results.sort(key=lambda x: x["final_score"], reverse=True)

    llm_count   = sum(1 for r in results if r.get("scoring_method") == "llm")
    rules_count = sum(1 for r in results if r.get("scoring_method") == "rules")

    return {
        "campaign"     : campaign.title,
        "total_scored" : len(results),
        "llm_scored"   : llm_count,
        "rules_scored" : rules_count,
        "results"      : results
    }


# ─── GET /scoring/rankings/{campaign_id} ────
# DOIT ÊTRE AVANT /{candidate_id}/{campaign_id}
import re

def clean_email(raw: str) -> str:
    """Extrait uniquement l'adresse email d'une chaîne."""
    if not raw:
        return None
    match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw)
    return match.group(0) if match else None

def clean_name(raw: str) -> str:
    """Nettoie le nom du candidat."""
    if not raw:
        return "Inconnu"
    # Supprimer les retours à la ligne et tout ce qui suit
    name = raw.split('\n')[0].strip()
    # Ignorer si ça ressemble à une URL
    if 'linkedin.com' in name or 'http' in name or '@' in name:
        return "Inconnu"
    return name


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

        raw_email = candidate.email if candidate else None
        raw_name  = candidate.name  if candidate else "Inconnu"

        rankings.append({
            "rank"             : i + 1,
            "candidate_id"     : str(score.candidate_id),
            "candidate_name"   : clean_name(raw_name),
            "candidate_email"  : clean_email(raw_email),
            "skill_score"      : score.skill_score,
            "experience_score" : score.experience_score,
            "education_score"  : score.education_score,
            "final_score"      : score.final_score
        })

    return {
        "campaign"         : campaign.title,
        "total_candidates" : len(rankings),
        "rankings"         : rankings
    }

# ─── POST /scoring/{candidate_id}/{campaign_id}
# EN DERNIER car routes dynamiques
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