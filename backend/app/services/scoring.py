from sentence_transformers import SentenceTransformer, util
from sqlalchemy.orm import Session
from app.models.models import Candidate, Campaign, CandidateSkill, CandidateScore, Recommendation
import threading

# Charger le modèle SBERT en arrière-plan
model = None

def load_model():
    global model
    print("⏳ Chargement du modèle SBERT...")
    model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    print("✅ Modèle SBERT chargé !")

# Lancer le chargement dans un thread séparé
threading.Thread(target=load_model, daemon=True).start()


#calcul de similarité SBERT
def compute_semantic_similarity(skills_candidate: list, skills_required: list) -> float:
    if not skills_candidate or not skills_required:
        return 0.0
    
    # Si le modèle n'est pas encore chargé, retourner un score par défaut
    if model is None:
        print("⚠️ Modèle SBERT pas encore chargé, score par défaut utilisé")
        return 50.0

    text_candidate = " ".join(skills_candidate)
    text_required = " ".join(skills_required)

    embedding_candidate = model.encode(text_candidate, convert_to_tensor=True)
    embedding_required = model.encode(text_required, convert_to_tensor=True)

    similarity = util.cos_sim(embedding_candidate, embedding_required)
    return float(similarity[0][0]) * 100

# calcule du score d'expérience
def compute_experience_score(candidate_exp: int, required_exp: int) -> int:
    if required_exp == 0:
        return 20
    if candidate_exp >= required_exp:
        return 20
    return round((candidate_exp / required_exp) * 20)

# calcule du score d'éducation
def compute_education_score(education: str) -> int:
    if not education:
        return 10
    education_lower = education.lower()
    if any(k in education_lower for k in ["ingénieur", "engineer", "master", "phd", "doctorat"]):
        return 20
    if any(k in education_lower for k in ["licence", "bachelor", "bsc"]):
        return 15
    return 10

# DÉTERMINER LA RECOMMANDATION
def determine_recommendation(final_score: int) -> dict:
    if final_score >= 80:
        return {
            "recommendation": "Fortement Recommandé",
            "reason": "Adéquation excellente avec le poste. Les compétences techniques et l'expérience correspondent parfaitement au profil recherché."
        }
    elif final_score >= 60:
        return {
            "recommendation": "Profil Potentiel",
            "reason": "Profil intéressant avec de bonnes bases. Quelques compétences secondaires restent à acquérir."
        }
    else:
        return {
            "recommendation": "Non Retenu",
            "reason": "Le profil ne correspond pas suffisamment aux exigences techniques du poste."
        }

# FONCTION PRINCIPALE DE SCORING
def score_candidate(
    db: Session,
    candidate_id: str,
    campaign_id: str,
    required_exp: int = 1
) -> dict:

    # Récupérer le candidat
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        return {"error": "Candidat non trouvé"}

    # Récupérer la campagne
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return {"error": "Campagne non trouvée"}

    # Récupérer les compétences du candidat
    candidate_skills = db.query(CandidateSkill).filter(
        CandidateSkill.candidate_id == candidate_id
    ).all()
    skills_list = [s.skill_name for s in candidate_skills]

    # Récupérer les compétences requises de la campagne
    required_skills = campaign.required_skills or []

    # 1. Score sémantique SBERT (60%)
    semantic_score = compute_semantic_similarity(skills_list, required_skills)
    skill_score = round(semantic_score * 0.6)

    # 2. Score d'expérience (20%)
    experience_score = compute_experience_score(
        candidate.experience_years or 0,
        required_exp
    )

    # 3. Score d'éducation (20%)
    education_score = compute_education_score(candidate.education)

    # 4. Score final
    final_score = min(skill_score + experience_score + education_score, 100)

    # 5. Déterminer la recommandation
    rec = determine_recommendation(final_score)

    # 6. Sauvegarder ou mettre à jour le score en base
    existing_score = db.query(CandidateScore).filter(
        CandidateScore.candidate_id == candidate_id,
        CandidateScore.campaign_id == campaign_id
    ).first()

    if existing_score:
        existing_score.skill_score = skill_score
        existing_score.experience_score = experience_score
        existing_score.education_score = education_score
        existing_score.final_score = final_score
    else:
        new_score = CandidateScore(
            candidate_id=candidate_id,
            campaign_id=campaign_id,
            skill_score=skill_score,
            experience_score=experience_score,
            education_score=education_score,
            final_score=final_score
        )
        db.add(new_score)

    # 7. Sauvegarder la recommandation
    existing_rec = db.query(Recommendation).filter(
        Recommendation.candidate_id == candidate_id,
        Recommendation.campaign_id == campaign_id
    ).first()

    if existing_rec:
        existing_rec.recommendation = rec["recommendation"]
        existing_rec.reason = rec["reason"]
    else:
        new_rec = Recommendation(
            candidate_id=candidate_id,
            campaign_id=campaign_id,
            recommendation=rec["recommendation"],
            reason=rec["reason"]
        )
        db.add(new_rec)

    db.commit()

    return {
        "candidate_name": candidate.name,
        "campaign_title": campaign.title,
        "skill_score": skill_score,
        "experience_score": experience_score,
        "education_score": education_score,
        "final_score": final_score,
        "recommendation": rec["recommendation"],
        "reason": rec["reason"]
    }