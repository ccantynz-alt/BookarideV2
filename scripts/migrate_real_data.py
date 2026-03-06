"""
migrate_real_data.py

Migrates real production data from MongoDB 'Bookaride_db' (capital B)
into Neon PostgreSQL.

Steps it performs automatically:
  1. Cleans the 1,200 seeded test bookings from Neon
  2. Imports all real collections from Bookaride_db

Usage (PowerShell):
    $env:DATABASE_URL="postgresql://neondb_owner:npg_coP0gWvAdS2N@ep-jolly-queen-aihsx1yx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
    $env:MONGO_URL="mongodb+srv://bookaride_db:FDP1PLGG37GOT5Id@cluster0.vte8b8.mongodb.net/Bookaride_db?authSource=admin&appName=Cluster0"

    # Dry run first (no changes made):
    python scripts\\migrate_real_data.py

    # Actually run it:
    python scripts\\migrate_real_data.py --confirm
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, date

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

try:
    import asyncpg
    import pymongo
except ImportError as e:
    print(f"Missing package: {e}. Run: pip install asyncpg pymongo")
    sys.exit(1)

MONGO_URL = os.environ.get(
    "MONGO_URL",
    "mongodb+srv://bookaride_db:FDP1PLGG37GOT5Id@cluster0.vte8b8.mongodb.net/Bookaride_db?authSource=admin&appName=Cluster0"
)
DATABASE_URL = os.environ.get("DATABASE_URL", "")
DRY_RUN = "--confirm" not in sys.argv

# Collections to migrate, in order
# Format: (mongo_collection_name, neon_table_name, description)
COLLECTIONS = [
    ("bookings",              "bookings",              "Real bookings"),
    ("bookings_archive",      "bookings_archive",      "Archived bookings"),
    ("payment_transactions",  "payment_transactions",  "Payment records"),
    ("admin_users",           "admin_users",           "Admin accounts"),
    ("password_reset_tokens", "password_reset_tokens", "Password tokens"),
    ("counters",              "counters",              "ID counters"),
    ("deleted_bookings",      "deleted_bookings",      "Deleted bookings"),
    ("booking_backups",       "booking_backups",       "Booking backups"),
    ("seo_pages",             "seo_pages",             "SEO pages"),
    ("seo_health_reports",    "seo_health_reports",    "SEO reports"),
    ("return_alerts_sent",    "return_alerts_sent",    "Return alerts"),
    ("error_check_reports",   "error_check_reports",   "Error reports"),
    ("system_tasks",          "system_tasks",          "System tasks"),
]


def serialize(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if hasattr(obj, "__str__"):
        return str(obj)
    raise TypeError(f"Not serializable: {type(obj)}")


def clean_doc(doc: dict) -> dict:
    """Remove MongoDB-specific fields and make JSON-serializable."""
    doc.pop("_id", None)
    return json.loads(json.dumps(doc, default=serialize))


async def ensure_table(conn, table: str):
    await conn.execute(f"""
        CREATE TABLE IF NOT EXISTS {table} (
            _id BIGSERIAL PRIMARY KEY,
            id TEXT UNIQUE,
            data JSONB NOT NULL DEFAULT '{{}}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    await conn.execute(
        f"CREATE INDEX IF NOT EXISTS idx_{table}_data ON {table} USING GIN (data)"
    )


async def main():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set.")
        print("  $env:DATABASE_URL='postgresql://...'")
        sys.exit(1)

    log.info("=" * 60)
    log.info("BookARide: Bookaride_db → Neon Migration")
    log.info(f"Mode: {'DRY RUN (add --confirm to execute)' if DRY_RUN else 'LIVE'}")
    log.info("=" * 60)

    # ── Connect to MongoDB ────────────────────────────────────────────────────
    log.info("\nConnecting to MongoDB Bookaride_db...")
    try:
        mongo_client = pymongo.MongoClient(MONGO_URL, serverSelectionTimeoutMS=10000)
        mongo_db = mongo_client.get_database()
        mongo_client.admin.command("ping")
        db_name = mongo_db.name
        log.info(f"  Connected to MongoDB database: {db_name}")
    except Exception as e:
        log.error(f"  MongoDB connection failed: {e}")
        sys.exit(1)

    # ── Connect to Neon ───────────────────────────────────────────────────────
    log.info("Connecting to Neon PostgreSQL...")
    try:
        pg = await asyncpg.connect(DATABASE_URL)
        log.info("  Connected to Neon")
    except Exception as e:
        log.error(f"  Neon connection failed: {e}")
        sys.exit(1)

    try:
        # ── Step 1: Count what's coming ───────────────────────────────────────
        log.info("\n── What's in Bookaride_db ──────────────────────────────")
        total_to_import = 0
        for mongo_col, _, desc in COLLECTIONS:
            try:
                count = mongo_db[mongo_col].count_documents({})
                if count > 0:
                    log.info(f"  {mongo_col:<30} {count:>6} docs  ({desc})")
                    total_to_import += count
            except Exception:
                pass
        log.info(f"\n  Total to import: {total_to_import}")

        # ── Step 2: Clean seeded test bookings from Neon ──────────────────────
        log.info("\n── Step 1: Clean seeded test data from Neon ────────────")
        try:
            seeded = await pg.fetchval("""
                SELECT COUNT(*) FROM bookings
                WHERE (data->>'referenceNumber')::int BETWEEN 10 AND 1209
            """)
            log.info(f"  Seeded test bookings found: {seeded}")

            if not DRY_RUN and seeded > 0:
                deleted = await pg.execute("""
                    DELETE FROM bookings
                    WHERE (data->>'referenceNumber')::int BETWEEN 10 AND 1209
                """)
                log.info(f"  Deleted {deleted.split()[-1]} seeded bookings")
            elif DRY_RUN:
                log.info(f"  (dry run) Would delete {seeded} seeded bookings")
        except Exception as e:
            log.warning(f"  Could not clean seeded data: {e}")

        # ── Step 3: Import each collection ────────────────────────────────────
        log.info("\n── Step 2: Import from Bookaride_db ────────────────────")
        grand_total = 0

        for mongo_col, pg_table, desc in COLLECTIONS:
            docs = list(mongo_db[mongo_col].find({}))
            if not docs:
                continue

            log.info(f"\n  {mongo_col} → {pg_table} ({len(docs)} docs)")

            if DRY_RUN:
                log.info(f"    (dry run) Would import {len(docs)} documents")
                continue

            # Ensure table exists
            await ensure_table(pg, pg_table)

            inserted = 0
            skipped = 0

            for doc in docs:
                clean = clean_doc(doc)
                doc_id = (
                    clean.get("id") or
                    clean.get("bookingId") or
                    clean.get("referenceNumber") or
                    clean.get("email") or
                    None
                )
                if doc_id:
                    doc_id = str(doc_id)

                data_json = json.dumps(clean)

                try:
                    await pg.execute(
                        f"INSERT INTO {pg_table} (id, data) VALUES ($1, $2::jsonb) "
                        f"ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
                        doc_id, data_json
                    )
                    inserted += 1
                except asyncpg.UniqueViolationError:
                    # No unique id — insert without id
                    try:
                        await pg.execute(
                            f"INSERT INTO {pg_table} (data) VALUES ($1::jsonb)",
                            data_json
                        )
                        inserted += 1
                    except Exception as e2:
                        log.warning(f"    skip (error): {e2}")
                        skipped += 1
                except Exception as e:
                    log.warning(f"    skip: {e}")
                    skipped += 1

            log.info(f"    Imported {inserted}/{len(docs)}  (skipped {skipped})")
            grand_total += inserted

        # ── Step 4: Final summary ─────────────────────────────────────────────
        log.info("\n── Final Neon State ────────────────────────────────────")
        tables = await pg.fetch(
            "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
        )
        for row in tables:
            t = row["tablename"]
            c = await pg.fetchval(f"SELECT COUNT(*) FROM {t}")
            log.info(f"  {t:<35} {c:>6} rows")

        log.info("\n" + "=" * 60)
        if DRY_RUN:
            log.info("DRY RUN complete — no changes were made.")
            log.info("Run with --confirm to execute the migration.")
        else:
            log.info(f"Migration complete! Imported {grand_total} documents.")
            log.info("\nNext steps:")
            log.info("  1. Run: python scripts\\verify_neon_data.py")
            log.info("  2. Test V2 admin dashboard and booking flow")
            log.info("  3. Update V2 env vars (DATABASE_URL in Render/Vercel)")
            log.info("  4. Once confirmed, decommission V1 and MongoDB Atlas")
        log.info("=" * 60)

    finally:
        await pg.close()
        mongo_client.close()


if __name__ == "__main__":
    asyncio.run(main())
