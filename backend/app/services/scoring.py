from sqlalchemy.orm import Session
from app.models.models import Candidate, Campaign, CandidateSkill, CandidateScore, Recommendation
from app.services.llm_extraction import score_with_llm


# ─────────────────────────────────────────
# FALLBACK SCORING (si le LLM échoue)
# ─────────────────────────────────────────
def compute_keyword_overlap_score(skills_candidate: list, skills_required: list) -> int:
    if not skills_required:
        return 30
    candidate_lower = [s.lower() for s in skills_candidate]
    required_lower = [s.lower() for s in skills_required]
    matches = sum(1 for skill in required_lower if skill in candidate_lower)
    return round((matches / len(required_lower)) * 60)


def compute_experience_score(candidate_exp: int, required_exp: int) -> int:
    if required_exp == 0:
        return 20
    if candidate_exp >= required_exp:
        return 20
    return round((candidate_exp / required_exp) * 20)


def compute_education_score(education: str) -> int:
    if not education:
        return 10
    education_lower = education.lower()
    if any(k in education_lower for k in ["ingénieur", "engineer", "master", "phd", "doctorat"]):
        return 20
    if any(k in education_lower for k in ["licence", "bachelor", "bsc"]):
        return 15
    return 10


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


# ─────────────────────────────────────────
# FONCTION PRINCIPALE DE SCORING
# ─────────────────────────────────────────
def score_candidate(
    db: Session,
    candidate_id: str,
    campaign_id: str,
    required_exp: int = 1
) -> dict:

    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        return {"error": "Candidat non trouvé"}

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return {"error": "Campagne non trouvée"}

    candidate_skills = db.query(CandidateSkill).filter(
        CandidateSkill.candidate_id == candidate_id
    ).all()
    skills_list = [s.skill_name for s in candidate_skills]
    required_skills = campaign.required_skills or []

    # Tentative scoring via LLM
    llm_result = score_with_llm(
        skills_list, candidate.experience_years or 0,
        candidate.education, required_skills, campaign.title
    )

    if llm_result and "final_score" in llm_result:
        skill_score = llm_result.get("skill_score", 0)
        experience_score = llm_result.get("experience_score", 0)
        education_score = llm_result.get("education_score", 0)
        final_score = llm_result.get("final_score", 0)
        recommendation = llm_result.get("recommendation", "Non Retenu")
        reason = llm_result.get("reason", "")
        method = "llm"
    else:
        # Fallback méthode classique
        print("⚠️ LLM indisponible pour le scoring, fallback sur méthode classique")
        skill_score = compute_keyword_overlap_score(skills_list, required_skills)
        experience_score = compute_experience_score(candidate.experience_years or 0, required_exp)
        education_score = compute_education_score(candidate.education)
        final_score = min(skill_score + experience_score + education_score, 100)
        rec = determine_recommendation(final_score)
        recommendation = rec["recommendation"]
        reason = rec["reason"]
        method = "rules"

    # Sauvegarder le score
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
        db.add(CandidateScore(
            candidate_id=candidate_id,
            campaign_id=campaign_id,
            skill_score=skill_score,
            experience_score=experience_score,
            education_score=education_score,
            final_score=final_score
        ))

    # Sauvegarder la recommandation
    existing_rec = db.query(Recommendation).filter(
        Recommendation.candidate_id == candidate_id,
        Recommendation.campaign_id == campaign_id
    ).first()

    if existing_rec:
        existing_rec.recommendation = recommendation
        existing_rec.reason = reason
    else:
        db.add(Recommendation(
            candidate_id=candidate_id,
            campaign_id=campaign_id,
            recommendation=recommendation,
            reason=reason
        ))

    db.commit()

    return {
        "candidate_name": candidate.name,
        "campaign_title": campaign.title,
        "skill_score": skill_score,
        "experience_score": experience_score,
        "education_score": education_score,
        "final_score": final_score,
        "recommendation": recommendation,
        "reason": reason,
        "scoring_method": method,
    }