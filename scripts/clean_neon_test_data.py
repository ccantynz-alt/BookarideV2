"""
clean_neon_test_data.py

Removes seeded test data from Neon PostgreSQL, keeping only real records
(admin_users and anything imported from MongoDB).

What it deletes:
  - All 1,200 seeded bookings (reference numbers 10-1209, created by seed_bookings.py)
  - Any other obviously fake/test records

What it KEEPS:
  - admin_users (your 2 real admin accounts)
  - error_check_reports
  - password_reset_tokens

Usage (PowerShell):
    $env:DATABASE_URL="postgresql://..."
    python scripts\\clean_neon_test_data.py

    # Add --confirm to actually delete (dry-run by default)
    python scripts\\clean_neon_test_data.py --confirm
"""

import asyncio
import os
import sys

try:
    import asyncpg
except ImportError:
    print("asyncpg not installed. Run: pip install asyncpg")
    sys.exit(1)

DATABASE_URL = os.environ.get("DATABASE_URL", "")
DRY_RUN = "--confirm" not in sys.argv


async def main():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set.")
        print("  $env:DATABASE_URL='postgresql://...'")
        sys.exit(1)

    conn = await asyncpg.connect(DATABASE_URL)

    print()
    print("=" * 55)
    print("  Neon Test Data Cleanup")
    print(f"  Mode: {'DRY RUN (pass --confirm to delete)' if DRY_RUN else 'LIVE DELETE'}")
    print("=" * 55)

    try:
        # ── Check what's in each table ───────────────────────────────────
        tables = await conn.fetch("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)

        print()
        for row in tables:
            table = row["tablename"]
            count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
            print(f"  {table:<35} {count:>6} rows")

        # ── Count seeded bookings ─────────────────────────────────────────
        # Seeded bookings have referenceNumber between 10 and 1209
        # (seed_bookings.py output: "Reference numbers used: 10 – 1209")
        try:
            seeded_count = await conn.fetchval("""
                SELECT COUNT(*) FROM bookings
                WHERE (data->>'referenceNumber')::int BETWEEN 10 AND 1209
                   OR data->>'seeded' = 'true'
            """)
        except Exception:
            seeded_count = 0

        try:
            total_bookings = await conn.fetchval("SELECT COUNT(*) FROM bookings")
        except Exception:
            total_bookings = 0

        real_bookings = total_bookings - seeded_count

        print()
        print(f"  Bookings total:     {total_bookings}")
        print(f"  Seeded (to delete): {seeded_count}")
        print(f"  Real (to keep):     {real_bookings}")
        print()

        if seeded_count == 0:
            print("  Nothing to delete — no seeded bookings found.")
            return

        if DRY_RUN:
            print("  DRY RUN — no changes made.")
            print("  Run with --confirm to actually delete.")
            return

        # ── Delete seeded bookings ────────────────────────────────────────
        print("  Deleting seeded bookings...")
        deleted = await conn.execute("""
            DELETE FROM bookings
            WHERE (data->>'referenceNumber')::int BETWEEN 10 AND 1209
               OR data->>'seeded' = 'true'
        """)
        count = int(deleted.split()[-1])
        print(f"  Deleted {count} seeded bookings.")

        # ── Final state ───────────────────────────────────────────────────
        print()
        print("  Final row counts:")
        for row in tables:
            table = row["tablename"]
            count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
            print(f"    {table:<33} {count:>6} rows")

        print()
        print("  Done. Neon now contains only real data.")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
