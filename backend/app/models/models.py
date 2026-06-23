from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

# ─── TABLE USERS ───────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="recruiter")

# ─── TABLE CAMPAIGNS ───────────────────────────────────
class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text)
    required_skills = Column(JSONB)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    scores = relationship("CandidateScore", back_populates="campaign")
    recommendations = relationship("Recommendation", back_populates="campaign")

# ─── TABLE CANDIDATES ──────────────────────────────────
class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String)
    education = Column(Text)
    experience_years = Column(Integer, default=0)
    cv_path = Column(String)

    skills = relationship("CandidateSkill", back_populates="candidate")
    scores = relationship("CandidateScore", back_populates="candidate")
    recommendations = relationship("Recommendation", back_populates="candidate")

# ─── TABLE CANDIDATE_SKILLS ────────────────────────────
class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))
    skill_name = Column(String, nullable=False)

    candidate = relationship("Candidate", back_populates="skills")

# ─── TABLE CANDIDATE_SCORES ────────────────────────────
class CandidateScore(Base):
    __tablename__ = "candidate_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"))
    skill_score = Column(Integer, default=0)
    experience_score = Column(Integer, default=0)
    education_score = Column(Integer, default=0)
    final_score = Column(Integer, default=0)

    candidate = relationship("Candidate", back_populates="scores")
    campaign = relationship("Campaign", back_populates="scores")

# ─── TABLE RECOMMENDATIONS ─────────────────────────────
class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"))
    recommendation = Column(String)
    reason = Column(Text)

    candidate = relationship("Candidate", back_populates="recommendations")
    campaign = relationship("Campaign", back_populates="recommendations")