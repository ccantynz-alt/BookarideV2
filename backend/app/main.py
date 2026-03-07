import asyncio
import logging
import os
import traceback

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
    allow_origins=["*"],  # Allow all origins for now to avoid CORS issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database handle — set on startup
db: NeonDatabase = None  # type: ignore

# Track startup errors for diagnostics
_startup_errors: list[str] = []


@app.on_event("startup")
async def startup():
    global db
    if not settings.DATABASE_URL:
        msg = "DATABASE_URL not set — cannot connect to database"
        logger.error(msg)
        _startup_errors.append(msg)
        return
    try:
        db = await NeonDatabase.connect(settings.DATABASE_URL, min_size=2, max_size=20)
        logger.info("Connected to Neon PostgreSQL")
    except Exception as e:
        msg = f"Database connection failed: {e}"
        logger.error(msg)
        _startup_errors.append(msg)
        return

    # Apply schema
    try:
        schema_path = os.path.join(os.path.dirname(__file__), "..", "schema.sql")
        if os.path.exists(schema_path):
            async with db.pool.acquire() as conn:
                await conn.execute(open(schema_path).read())
            logger.info("Schema applied")
    except Exception as e:
        msg = f"Schema apply failed: {e}"
        logger.error(msg)
        _startup_errors.append(msg)


@app.on_event("shutdown")
async def shutdown():
    if db:
        await db.close()


# ── Health ───────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "bookaride-api",
        "version": "2.0.1",
        "routes_loaded": len(_route_modules),
        "route_errors": _route_errors,
        "startup_errors": _startup_errors,
    }


@app.get("/health")
@app.get("/healthz")
async def health():
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        await asyncio.wait_for(db.command("ping"), timeout=2.0)
        return {"status": "healthy", "database": "ok"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unreachable: {e}")


@app.get("/debug/routes")
async def debug_routes():
    """Show all registered routes — for debugging deployment issues."""
    routes = []
    for route in app.routes:
        if hasattr(route, "methods"):
            routes.append({"path": route.path, "methods": list(route.methods)})
    return {
        "total_routes": len(routes),
        "routes": routes,
        "route_modules_loaded": _route_modules,
        "route_errors": _route_errors,
        "startup_errors": _startup_errors,
    }


# ── Routes (with error handling per module) ──────────────────────

_route_modules: list[str] = []
_route_errors: list[str] = []

ROUTE_MODULES = ["auth", "bookings", "places", "payments", "drivers", "admin", "pricing"]

for _mod_name in ROUTE_MODULES:
    try:
        _mod = __import__(f"app.routes.{_mod_name}", fromlist=["router"])
        _router = _mod.router
        app.include_router(_router, prefix="/api")
        app.include_router(_router)
        _route_modules.append(_mod_name)
        logger.info(f"Loaded route module: {_mod_name}")
    except Exception as e:
        error_msg = f"Failed to load route module '{_mod_name}': {e}\n{traceback.format_exc()}"
        _route_errors.append(error_msg)
        logger.error(error_msg)
