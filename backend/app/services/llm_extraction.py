import requests
import json
import re

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
MODEL = "llama3.2"


def extract_cv_with_llm(cv_text: str) -> dict:
    """
    Utilise Ollama (llama3.2) pour extraire les informations structurées d'un CV.
    Retourne un dict ou None si l'extraction échoue.
    """
    prompt = f"""Tu es un extracteur de données de CV. Analyse ce texte de CV et réponds UNIQUEMENT avec un JSON valide, sans aucun texte avant ou après, sans markdown, sans explications.

Structure exacte attendue:
{{
  "name": "nom complet du candidat ou null",
  "email": "adresse email ou null",
  "phone": "numero de telephone ou null",
  "education": "diplome et ecole ou null",
  "experience_years": nombre entier d'annees d'experience,
  "skills": ["liste", "des", "competences", "techniques", "detectees"]
}}

Texte du CV:
{cv_text[:3000]}

Reponds uniquement avec le JSON, rien d'autre."""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.1}
            },
            timeout=60
        )
        response.raise_for_status()
        raw_output = response.json().get("response", "")
        return _parse_json_safe(raw_output)

    except Exception as e:
        print(f"⚠️ Erreur LLM extraction: {e}")
        return None


def score_with_llm(candidate_skills, candidate_exp, candidate_education,
                    campaign_skills, campaign_title) -> dict:
    """
    Utilise Ollama pour générer un score d'adéquation avec justification.
    """
    prompt = f"""Tu es un expert RH. Évalue l'adéquation de ce candidat pour le poste, et réponds UNIQUEMENT avec un JSON valide.

Poste: {campaign_title}
Compétences requises: {', '.join(campaign_skills) if campaign_skills else 'non précisées'}
Compétences du candidat: {', '.join(candidate_skills) if candidate_skills else 'aucune détectée'}
Expérience du candidat: {candidate_exp} ans
Formation du candidat: {candidate_education or 'non précisée'}

Structure exacte attendue:
{{
  "skill_score": nombre entre 0 et 60,
  "experience_score": nombre entre 0 et 20,
  "education_score": nombre entre 0 et 20,
  "final_score": nombre entre 0 et 100,
  "recommendation": "Fortement Recommandé" ou "Profil Potentiel" ou "Non Retenu",
  "reason": "explication en francais en 2 phrases maximum"
}}

Reponds uniquement avec le JSON, rien d'autre."""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.2}
            },
            timeout=60
        )
        response.raise_for_status()
        raw_output = response.json().get("response", "")
        return _parse_json_safe(raw_output)

    except Exception as e:
        print(f"⚠️ Erreur LLM scoring: {e}")
        return None


def _parse_json_safe(text: str) -> dict:
    """Nettoie et parse une réponse LLM censée être du JSON."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
        return None