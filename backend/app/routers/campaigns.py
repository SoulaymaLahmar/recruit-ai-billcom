from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

print("DEBUG: campaigns.py - importing dependencies")
try:
    from app.database import get_db
    print("DEBUG: campaigns.py - get_db imported")
except Exception as e:
    print(f"ERROR: campaigns.py - failed to import get_db: {e}")
    raise

try:
    from app.models.models import Campaign
    print("DEBUG: campaigns.py - Campaign imported")
except Exception as e:
    print(f"ERROR: campaigns.py - failed to import Campaign: {e}")
    raise

try:
    from app.schemas.schemas import CampaignCreate, CampaignResponse
    print("DEBUG: campaigns.py - schemas imported")
except Exception as e:
    print(f"ERROR: campaigns.py - failed to import schemas: {e}")
    raise

from typing import List
from uuid import UUID

print("DEBUG: campaigns.py - creating router")
router = APIRouter(
    prefix="/campaigns",
    tags=["Campaigns"]
)
print("DEBUG: campaigns.py - router created successfully")


# GET /campaigns 
# Retourne toutes les campagnes
@router.get("/", response_model=List[CampaignResponse])
def get_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).all()
    return campaigns


# GET /campaigns/{id}
# Retourne une campagne par son ID
@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: UUID, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    return campaign


# POST /campaigns
# Crée une nouvelle campagne
@router.post("/", response_model=CampaignResponse)
def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    new_campaign = Campaign(
        title=campaign.title,
        description=campaign.description,
        required_skills=campaign.required_skills
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign


#  DELETE /campaigns/{id}
# Supprime une campagne
@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: UUID, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    db.delete(campaign)
    db.commit()
    return {"message": "Campagne supprimée avec succès"}
