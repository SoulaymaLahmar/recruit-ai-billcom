
<div align="center">

# RecruitAI

### AI-Powered Recruitment & Intelligent Candidate Ranking Platform

**Transforming recruitment through Artificial Intelligence, NLP, and Large Language Models.**

<br/>

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![LLM](https://img.shields.io/badge/LLM-Llama%203.2-purple?style=for-the-badge)

</div>

---

##  Overview

**RecruitAI** is an AI-powered recruitment platform designed to automate CV analysis, candidate evaluation, and applicant ranking.

By leveraging **Large Language Models (LLMs)** and **Natural Language Processing (NLP)**, the platform extracts structured information from PDF resumes, evaluates candidate-job compatibility, and generates intelligent rankings to support recruiters in their decision-making process.




##  Key Features

###  Authentication
- Secure user registration and login.
- JWT-based authentication.
- Password hashing using bcrypt.
<img width="790" height="461" alt="image" src="https://github.com/user-attachments/assets/16ad9bde-8694-45c6-b67d-c4c3ea3c0df0" />


###  Recruitment Campaign Management
- Create and manage recruitment campaigns.
- Define job descriptions and required technical skills.
- Manage recruitment requirements dynamically.
<img width="815" height="597" alt="image" src="https://github.com/user-attachments/assets/ded31731-4b61-419b-9704-81e56e293b29" />

### AI-Powered CV Analysis
- Extract text from PDF resumes using `pdfplumber`.
- Use **Ollama – Llama 3.2** for intelligent information extraction.
- Extract candidate profiles, education, experience, and technical skills.
- Generate structured JSON outputs using prompt engineering.
- Regex-based fallback for reliable information extraction.
<img width="815" height="567" alt="image" src="https://github.com/user-attachments/assets/54ff012a-833e-49ba-ad49-93f478ff52b2" />

###  Intelligent Candidate Scoring
- AI-based candidate-job compatibility evaluation.
- Generate weighted scores from **0 to 100**.
- Provide AI-generated explanations for evaluation results.
- Automatically rank candidates based on their scores.
- Assign Gold 🥇, Silver 🥈, and Bronze 🥉 badges to top candidates.
- Keyword-based fallback scoring mechanism.
<img width="754" height="567" alt="image" src="https://github.com/user-attachments/assets/c06d4336-3698-42d1-8df0-5ac8f8e4a982" />

### Email Automation
- Send personalized emails through SMTP.
- Predefined email templates based on candidate evaluation.
- Customize email subjects and content.
- Bulk email delivery.

---


##  Technology Stack

###  Artificial Intelligence & NLP

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-0.17-black?style=for-the-badge&logo=ollama&logoColor=white)
![Llama](https://img.shields.io/badge/Llama-3.2-0467DF?style=for-the-badge)
![pdfplumber](https://img.shields.io/badge/pdfplumber-0.11-green?style=for-the-badge)

- **Python 3.11:** Backend development and AI processing.
- **Ollama 0.17:** Local LLM inference.
- **Llama 3.2:** Intelligent CV information extraction and candidate evaluation.
- **pdfplumber 0.11:** PDF text extraction and preprocessing.
- **Prompt Engineering:** Structured JSON generation and LLM-based evaluation.

###  Backend Development

![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=for-the-badge&logo=postgresql&logoColor=white)

- **FastAPI 0.110:** REST API development and request validation.
- **SQLAlchemy 2.0:** Database ORM and data management.
- **Alembic:** Database migrations.
- **PostgreSQL 15:** Relational database with JSONB support.

###  Frontend Development

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MUI](https://img.shields.io/badge/MUI-v6-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.7-671DDF?style=for-the-badge&logo=axios&logoColor=white)

- **React 18.3:** Interactive user interface and reusable components.
- **Material UI v6:** Responsive UI components and design system.
- **Framer Motion 11:** Smooth UI animations.
- **Axios 1.7:** HTTP requests and JWT authentication interceptors.

###  Security & Communication

- **JWT:** Secure authentication and authorization.
- **bcrypt:** Password hashing.
- **smtplib:** Automated email notifications through SMTP.

###  DevOps & Version Control

![Docker](https://img.shields.io/badge/Docker_Compose-2.39-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Git](https://img.shields.io/badge/Git-2.x-F05032?style=for-the-badge&logo=git&logoColor=white)

- **Docker Compose 2.39:** Containerization and reproducible development environment.
- **Git:** Version control and collaborative development.



## Project Objectives

RecruitAI aims to demonstrate the potential of Artificial Intelligence in modern recruitment by combining:

- Automated CV information extraction.
- LLM-powered candidate evaluation.
- Intelligent job-candidate matching.
- Explainable AI scoring.
- Automated candidate communication.


</div>
