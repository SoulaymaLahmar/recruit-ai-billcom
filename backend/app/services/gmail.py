import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL    = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587


def send_email(to: str, subject: str, body: str) -> dict:
    """
    Envoie un email via SMTP Gmail.
    Utilise smtplib (intégré Python) — aucun package externe nécessaire.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise Exception("SMTP_EMAIL ou SMTP_PASSWORD non configuré dans .env")

    try:
        # Créer le message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = f"RecrutIA <{SMTP_EMAIL}>"
        msg['To']      = to

        # Corps du message en texte
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        # Connexion SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to, msg.as_string())

        print(f"✅ Email envoyé à {to}")
        return {"status": "sent", "to": to}

    except smtplib.SMTPAuthenticationError:
        raise Exception(
            "Authentification SMTP échouée. "
            "Vérifiez SMTP_EMAIL et SMTP_PASSWORD dans .env. "
            "Utilisez un mot de passe d'application Gmail, pas votre mot de passe principal."
        )
    except smtplib.SMTPException as e:
        raise Exception(f"Erreur SMTP: {str(e)}")
    except Exception as e:
        raise Exception(f"Erreur inattendue: {str(e)}")