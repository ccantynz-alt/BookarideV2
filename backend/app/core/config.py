import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent.parent
load_dotenv(ROOT_DIR / ".env")


class Settings:
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "")
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    STRIPE_SECRET_KEY: str = os.environ.get("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    MAILGUN_API_KEY: str = os.environ.get("MAILGUN_API_KEY", "")
    MAILGUN_DOMAIN: str = os.environ.get("MAILGUN_DOMAIN", "bookaride.co.nz")

    TWILIO_ACCOUNT_SID: str = os.environ.get("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.environ.get("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.environ.get("TWILIO_PHONE_NUMBER", "")

    GOOGLE_MAPS_API_KEY: str = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET", "")

    PUBLIC_DOMAIN: str = os.environ.get("PUBLIC_DOMAIN", "https://bookaride.co.nz")
    PORT: int = int(os.environ.get("PORT", "10000"))

    @property
    def CORS_ORIGINS(self) -> list:
        origins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://bookaride.co.nz",
            "https://www.bookaride.co.nz",
        ]
        # Allow any Vercel preview/production domain
        extra = os.environ.get("EXTRA_CORS_ORIGINS", "")
        if extra:
            origins += [o.strip() for o in extra.split(",") if o.strip()]
        return origins


settings = Settings()
