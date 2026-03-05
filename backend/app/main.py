import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import NeonDatabase

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Rate limiter — keyed by client IP
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="BookARide API", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database handle
db: NeonDatabase = None  # type: ignore


# ── Scheduler ─────────────────────────────────────────────────────

async def _send_24h_reminders():
    """Run hourly — find confirmed bookings for tomorrow and send reminders."""
    if db is None:
        return
    try:
        nz_tz = __import__("pytz").timezone("Pacific/Auckland")
        tomorrow = (datetime.now(nz_tz) + timedelta(days=1)).strftime("%Y-%m-%d")
        bookings = await db.bookings.find(
            {"date": tomorrow, "status": "confirmed", "reminder_sent": {"$ne": True}},
            {"_id": 0},
        ).to_list(500)

        if not bookings:
            return

        from app.services.email import send_reminder_email
        from app.services.sms import send_reminder_sms

        for booking in bookings:
            await asyncio.gather(
                send_reminder_email(booking),
                send_reminder_sms(booking),
                return_exceptions=True,
            )
            await db.bookings.update_one(
                {"id": booking["id"]},
                {"$set": {"reminder_sent": True}},
            )
            logger.info(f"Reminder sent for booking {booking.get('id')}")
    except Exception as e:
        logger.error(f"Reminder scheduler error: {e}")


# ── Startup / Shutdown ────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    global db
    if not settings.DATABASE_URL:
        logger.error("DATABASE_URL not set — cannot connect to database")
        return
    db = await NeonDatabase.connect(settings.DATABASE_URL, min_size=5, max_size=50)
    logger.info("Connected to Neon PostgreSQL")

    # Apply schema
    schema_path = os.path.join(os.path.dirname(__file__), "..", "schema.sql")
    if os.path.exists(schema_path):
        async with db.pool.acquire() as conn:
            await conn.execute(open(schema_path).read())
        logger.info("Schema applied")

    # Start APScheduler
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    scheduler = AsyncIOScheduler(timezone="Pacific/Auckland")
    scheduler.add_job(_send_24h_reminders, "interval", hours=1, id="reminders")
    scheduler.start()
    app.state.scheduler = scheduler
    logger.info("Scheduler started — 24h reminders active")


@app.on_event("shutdown")
async def shutdown():
    if hasattr(app.state, "scheduler"):
        app.state.scheduler.shutdown(wait=False)
    if db:
        await db.close()


# ── Health ────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "ok", "service": "bookaride-api", "version": "2.0.0"}


@app.get("/health")
@app.get("/healthz")
async def health():
    try:
        await asyncio.wait_for(db.command("ping"), timeout=2.0)
        return {"status": "healthy", "database": "ok"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unreachable: {e}")


# ── Routes ────────────────────────────────────────────────────────

from app.routes import auth, bookings, places, payments, drivers, admin, pricing

app.include_router(auth.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(places.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(drivers.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(pricing.router, prefix="/api")
