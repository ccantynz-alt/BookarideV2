import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import (
    create_access_token,
    get_current_admin,
    hash_password,
    verify_password,
)
from app.models.admin import AdminLogin, AdminRegister

router = APIRouter(prefix="/admin", tags=["Auth"])


@router.post("/register")
async def register(
    data: AdminRegister,
    current_admin: Optional[dict] = None,
):
    """
    Register a new admin user.
    - First admin can register without auth (bootstrap).
    - After that, only existing admins can create new accounts.
    """
    from app.main import db

    # Check if any admins exist
    admin_count = await db.admin_users.count_documents({})

    if admin_count > 0:
        # Must be authenticated to register new admins
        if current_admin is None:
            raise HTTPException(
                status_code=403,
                detail="Registration is restricted. Only existing admins can create new accounts.",
            )

    existing = await db.admin_users.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    existing_email = await db.admin_users.find_one({"email": data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    admin_user = {
        "id": str(uuid.uuid4()),
        "username": data.username,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
    }
    await db.admin_users.insert_one(admin_user)

    token = create_access_token({"sub": data.username})
    return {"access_token": token, "token_type": "bearer", "username": data.username}


@router.post("/login")
async def login(data: AdminLogin):
    from app.main import db

    admin = await db.admin_users.find_one({"username": data.username}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(data.password, admin.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": admin["username"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": admin["username"],
        "email": admin.get("email"),
    }


# ── Google OAuth ───────────────────────────────────────────────


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token from frontend


@router.post("/auth/google")
async def google_auth(data: GoogleAuthRequest):
    """
    Authenticate via Google Sign-In.
    Verifies the Google ID token and creates/finds an admin account.
    Only allows sign-in for emails in the allowed list (or any @bookaride.co.nz email).
    """
    from app.main import db
    from app.core.config import settings

    # Verify the Google ID token
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")

    email = idinfo.get("email", "").lower()
    name = idinfo.get("name", "")

    if not email:
        raise HTTPException(status_code=401, detail="No email in Google token")

    # Allow any @bookaride.co.nz email, or check for existing admin account
    is_bookaride_email = email.endswith("@bookaride.co.nz")
    existing_admin = await db.admin_users.find_one({"email": email}, {"_id": 0})

    if not is_bookaride_email and not existing_admin:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Only authorized emails can sign in.",
        )

    # Create admin account if it doesn't exist (auto-provision for @bookaride.co.nz)
    if not existing_admin:
        username = email.split("@")[0]
        # Ensure unique username
        base_username = username
        counter = 1
        while await db.admin_users.find_one({"username": username}):
            username = f"{base_username}{counter}"
            counter += 1

        existing_admin = {
            "id": str(uuid.uuid4()),
            "username": username,
            "email": email,
            "hashed_password": "",  # No password for Google-only accounts
            "google_name": name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
            "auth_method": "google",
        }
        await db.admin_users.insert_one(existing_admin)

    token = create_access_token({"sub": existing_admin["username"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": existing_admin["username"],
        "email": existing_admin.get("email"),
    }
