import pdfplumber
import spacy
import re
import os

# Charger le modèle spaCy
nlp = spacy.load("en_core_web_sm")


# EXTRACTION DU TEXTE DEPUIS LE PDF

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
# EXTRACTION DE L'EMAIL
# ─────────────────────────────────────────
def extract_email(text: str) -> str:
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(pattern, text)
    return emails[0] if emails else None


# ─────────────────────────────────────────
# EXTRACTION DU TÉLÉPHONE
# ─────────────────────────────────────────
def extract_phone(text: str) -> str:
    pattern = r'(\+?[\d\s\-\.]{8,15})'
    phones = re.findall(pattern, text)
    return phones[0].strip() if phones else None


# ─────────────────────────────────────────
# EXTRACTION DU NOM (spaCy NER)
# ─────────────────────────────────────────
def extract_name(text: str) -> str:
    doc = nlp(text[:500])  # Cherche dans les 500 premiers caractères
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text
    # Fallback : première ligne du CV
    first_line = text.strip().split('\n')[0]
    return first_line.strip()


# ─────────────────────────────────────────
# EXTRACTION DES COMPÉTENCES
# ─────────────────────────────────────────
SKILLS_LIST = [
    # Langages
    "python", "java", "javascript", "typescript", "c++", "c#", "php", "ruby",
    "kotlin", "swift", "scala", "go", "rust",
    # Frontend
    "react", "angular", "vue", "html", "css", "tailwind", "bootstrap",
    "sass", "redux", "next.js", "nuxt",
    # Backend
    "fastapi", "django", "flask", "spring", "spring boot", "node.js",
    "express", "laravel", "symfony", "asp.net",
    # Base de données
    "postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle",
    "elasticsearch", "cassandra", "dynamodb",
    # DevOps
    "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd",
    "jenkins", "git", "github", "gitlab", "terraform", "ansible",
    # IA/ML
    "machine learning", "deep learning", "pytorch", "tensorflow",
    "scikit-learn", "nlp", "spacy", "bert", "pandas", "numpy",
    "opencv", "keras", "huggingface",
    # Autres
    "rest api", "graphql", "microservices", "agile", "scrum",
    "linux", "bash", "jira", "figma"
]


def extract_skills(text: str) -> list:
    text_lower = text.lower()
    found_skills = []
    for skill in SKILLS_LIST:
        if skill in text_lower:
            found_skills.append(skill)
    return found_skills


# ─────────────────────────────────────────
# EXTRACTION DU DIPLÔME
# ─────────────────────────────────────────
def extract_education(text: str) -> str:
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


# ─────────────────────────────────────────
# EXTRACTION DES ANNÉES D'EXPÉRIENCE
# ─────────────────────────────────────────
def extract_experience_years(text: str) -> int:
    patterns = [
        r'(\d+)\s*(?:ans?|years?)\s*(?:d\'expérience|of experience|experience)',
        r'(\d+)\+?\s*(?:ans?|years?)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
    return 0


# ─────────────────────────────────────────
# FONCTION PRINCIPALE — ANALYSER UN CV
# ─────────────────────────────────────────
def analyze_cv(file_path: str) -> dict:
    print(f"📄 Analyse du CV : {file_path}")

    # 1. Extraire le texte brut du PDF
    text = extract_text_from_pdf(file_path)

    if not text:
        return {"error": "Impossible d'extraire le texte du PDF"}

    # 2. Extraire toutes les informations
    result = {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "education": extract_education(text),
        "experience_years": extract_experience_years(text),
        "skills": extract_skills(text),
        "raw_text": text[:500]  # Les 500 premiers caractères pour debug
    }

    print(f"✅ Extraction terminée : {result['name']} - {len(result['skills'])} compétences trouvées")
    return result