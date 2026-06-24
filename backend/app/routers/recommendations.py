from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Recommendation
from app.schemas.schemas import RecommendationResponse
from typing import List
from uuid import UUID

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)

# GET /recommendations
@router.get("/", response_model=List[RecommendationResponse])
def get_recommendations(db: Session = Depends(get_db)):
    return db.query(Recommendation).all()

# GET /recommendations/{candidate_id}/{campaign_id}
@router.get("/{candidate_id}/{campaign_id}", response_model=RecommendationResponse)
def get_recommendation(candidate_id: UUID, campaign_id: UUID, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(
        Recommendation.candidate_id == candidate_id,
        Recommendation.campaign_id == campaign_id
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommandation non trouvée")
    return rec

# DELETE /recommendations/{id}
@router.delete("/{recommendation_id}")
def delete_recommendation(recommendation_id: UUID, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommandation non trouvée")
    db.delete(rec)
    db.commit()
    return {"message": "Recommandation supprimée avec succès"}
