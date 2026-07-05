import pdfplumber
import re
from app.services.llm_extraction import extract_cv_with_llm


# ─────────────────────────────────────────
# EXTRACTION DU TEXTE DEPUIS LE PDF
# ─────────────────────────────────────────
def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"❌ Erreur extraction PDF: {e}")
    return text


# ─────────────────────────────────────────
# FALLBACK REGEX (si le LLM échoue)
# ─────────────────────────────────────────
def extract_email(text: str) -> str:
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(pattern, text)
    return emails[0] if emails else None


def extract_phone(text: str) -> str:
    pattern = r'(\+?[\d\s\-\.]{8,15})'
    phones = re.findall(pattern, text)
    return phones[0].strip() if phones else None


def extract_name_fallback(text: str) -> str:
    first_line = text.strip().split('\n')[0]
    return first_line.strip() if first_line else None


def extract_education_fallback(text: str) -> str:
    education_keywords = [
        "ingénieur", "master", "licence", "bachelor", "doctorat", "phd",
        "engineer", "degree", "university", "université", "école", "institut",
        "insat", "esprit", "supcom", "fst", "iset", "enit"
    ]
    lines = text.split('\n')
    for line in lines:
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in education_keywords):
            return line.strip()
    return None


def extract_experience_years_fallback(text: str) -> int:
    patterns = [
        r'(\d+)\s*(?:ans?|years?)\s*(?:d\'expérience|of experience|experience)',
        r'(\d+)\+?\s*(?:ans?|years?)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
    return 0


SKILLS_LIST = [
    "python", "java", "javascript", "typescript", "c++", "c#", "php", "ruby",
    "react", "angular", "vue", "html", "css", "tailwind", "bootstrap",
    "fastapi", "django", "flask", "spring", "spring boot", "node.js", "express",
    "postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle",
    "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "jenkins", "git",
    "machine learning", "deep learning", "pytorch", "tensorflow", "scikit-learn",
    "nlp", "pandas", "numpy",
    "rest api", "graphql", "microservices", "agile", "scrum"
]


def extract_skills_fallback(text: str) -> list:
    text_lower = text.lower()
    return [skill for skill in SKILLS_LIST if skill in text_lower]


# ─────────────────────────────────────────
# FONCTION PRINCIPALE — ANALYSER UN CV
# ─────────────────────────────────────────
def analyze_cv(file_path: str) -> dict:
    print(f"📄 Analyse du CV : {file_path}")

    text = extract_text_from_pdf(file_path)
    if not text:
        return {"error": "Impossible d'extraire le texte du PDF"}

    # Tentative avec le LLM en premier
    llm_result = extract_cv_with_llm(text)

    if llm_result and llm_result.get("name"):
        print(f"✅ Extraction LLM réussie : {llm_result.get('name')}")
        return {
            "name": llm_result.get("name"),
            "email": llm_result.get("email"),
            "phone": llm_result.get("phone"),
            "education": llm_result.get("education"),
            "experience_years": llm_result.get("experience_years", 0),
            "skills": llm_result.get("skills", []),
            "raw_text": text[:500],
            "extraction_method": "llm",
        }

    # Fallback sur regex simples
    print("⚠️ LLM indisponible, fallback sur méthode regex")
    return {
        "name": extract_name_fallback(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "education": extract_education_fallback(text),
        "experience_years": extract_experience_years_fallback(text),
        "skills": extract_skills_fallback(text),
        "raw_text": text[:500],
        "extraction_method": "rules",
    }