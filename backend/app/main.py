import asyncio
import logging
import os

from fastapi import FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import NeonDatabase

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="BookARide API", version="2.0.0")

# CORS — allow listed origins + any *.vercel.app preview URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database handle — set on startup
db: NeonDatabase = None  # type: ignore


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


@app.on_event("shutdown")
async def shutdown():
    if db:
        await db.close()


# ── Health ───────────────────────────────────────────────────────

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


# ── Routes ───────────────────────────────────────────────────────

from app.routes import auth, bookings, places, payments, drivers, admin, pricing

all_routers = [auth.router, bookings.router, places.router, payments.router, drivers.router, admin.router, pricing.router]

for r in all_routers:
    # Mount at /api/... (for Vite dev proxy: /api → localhost:10000)
    app.include_router(r, prefix="/api")
    # Also mount without /api prefix (for production where VITE_API_URL
    # points directly to the backend, e.g. https://backend.onrender.com)
    app.include_router(r)
