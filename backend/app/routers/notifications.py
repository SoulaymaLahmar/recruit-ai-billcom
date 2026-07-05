from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.gmail import send_email

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


class EmailRequest(BaseModel):
    email: str
    subject: str
    body: str


class BulkEmailItem(BaseModel):
    email: str
    subject: str
    body: str


class BulkEmailRequest(BaseModel):
    emails: List[BulkEmailItem]


# ─── POST /notifications/send-email ─────
@router.post("/send-email")
def send_single_email(payload: EmailRequest):
    if not payload.email:
        raise HTTPException(status_code=400, detail="Email destinataire manquant")
    try:
        result = send_email(
            to=payload.email,
            subject=payload.subject,
            body=payload.body
        )
        return {
            "message": f"Email envoyé à {payload.email}",
            "status": "sent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── POST /notifications/send-bulk ──────
@router.post("/send-bulk")
def send_bulk_emails(payload: BulkEmailRequest):
    results = []
    for item in payload.emails:
        try:
            send_email(
                to=item.email,
                subject=item.subject,
                body=item.body
            )
            results.append({ "email": item.email, "status": "sent" })
        except Exception as e:
            results.append({ "email": item.email, "status": "error", "error": str(e) })

    sent_count  = sum(1 for r in results if r["status"] == "sent")
    error_count = sum(1 for r in results if r["status"] == "error")

    return {
        "total"  : len(results),
        "sent"   : sent_count,
        "errors" : error_count,
        "results": results
    }


# ─── GET /notifications/status ──────────
@router.get("/status")
def check_smtp_status():
    import smtplib, os
    email = os.getenv("SMTP_EMAIL")
    password = os.getenv("SMTP_PASSWORD")

    if not email or not password:
        return {
            "status": "error",
            "message": "SMTP_EMAIL ou SMTP_PASSWORD manquant dans .env"
        }
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()
            server.login(email, password)
        return {
            "status": "ok",
            "message": f"SMTP Gmail connecté ✅ ({email})"
        }
    except smtplib.SMTPAuthenticationError:
        return {
            "status": "error",
            "message": "Authentification échouée — vérifiez le mot de passe d'application"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}