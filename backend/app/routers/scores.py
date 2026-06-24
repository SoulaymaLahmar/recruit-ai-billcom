from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import CandidateScore
from app.schemas.schemas import ScoreResponse
from typing import List
from uuid import UUID

router = APIRouter(
    prefix="/scores",
    tags=["Scores"]
)

# GET /scores
@router.get("/", response_model=List[ScoreResponse])
def get_scores(db: Session = Depends(get_db)):
    return db.query(CandidateScore).all()

# GET /scores/{candidate_id}/{campaign_id}
@router.get("/{candidate_id}/{campaign_id}", response_model=ScoreResponse)
def get_score(candidate_id: UUID, campaign_id: UUID, db: Session = Depends(get_db)):
    score = db.query(CandidateScore).filter(
        CandidateScore.candidate_id == candidate_id,
        CandidateScore.campaign_id == campaign_id
    ).first()
    if not score:
        raise HTTPException(status_code=404, detail="Score non trouvé")
    return score

# DELETE /scores/{id}
@router.delete("/{score_id}")
def delete_score(score_id: UUID, db: Session = Depends(get_db)):
    score = db.query(CandidateScore).filter(CandidateScore.id == score_id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Score non trouvé")
    db.delete(score)
    db.commit()
    return {"message": "Score supprimé avec succès"}