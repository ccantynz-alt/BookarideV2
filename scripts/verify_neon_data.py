#!/usr/bin/env python3
"""
verify_neon_data.py

Connects to your Neon PostgreSQL database and prints a report of:
  - Every table that exists
  - Row count per table
  - The most recent 3 records from key collections (bookings, users, drivers)
  - Any obviously empty tables that should have data

Usage:
  export DATABASE_URL="postgresql://..."
  python3 scripts/verify_neon_data.py

  # Or inline:
  DATABASE_URL="postgresql://..." python3 scripts/verify_neon_data.py
"""

import asyncio
import json
import os
import sys
from datetime import datetime

try:
    import asyncpg
except ImportError:
    print("asyncpg not installed. Run: pip install asyncpg")
    sys.exit(1)

DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Collections we expect to have data after migration from V1
EXPECTED_TABLES = ["bookings", "users", "drivers", "pricing", "admin_users"]

# Fields to display as a summary per record
PREVIEW_FIELDS = {
    "bookings": ["id", "status", "customerName", "pickupAddress", "createdAt", "totalPrice"],
    "users":    ["id", "name", "email", "createdAt"],
    "drivers":  ["id", "name", "email", "status"],
    "admin_users": ["id", "username", "email"],
}


def fmt(val):
    if val is None:
        return "—"
    if isinstance(val, str) and len(val) > 60:
        return val[:57] + "..."
    return str(val)


async def main():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable is not set.")
        print("  export DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'")
        sys.exit(1)

    print(f"\n{'='*65}")
    print("  Neon Database Verification Report")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*65}\n")

    try:
        conn = await asyncpg.connect(DATABASE_URL)
    except Exception as e:
        print(f"ERROR: Could not connect to Neon database.\n  {e}")
        sys.exit(1)

    try:
        # ── List all tables ──────────────────────────────────────────────
        rows = await conn.fetch("""
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        all_tables = [r["tablename"] for r in rows]

        if not all_tables:
            print("  No tables found. The database appears to be empty.")
            print("  Run the schema setup or check your DATABASE_URL.\n")
            return

        # ── Row counts ───────────────────────────────────────────────────
        print(f"  {'TABLE':<25} {'ROWS':>8}  STATUS")
        print(f"  {'-'*25} {'-'*8}  {'-'*20}")

        table_counts = {}
        for table in all_tables:
            try:
                count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
            except Exception:
                count = -1
            table_counts[table] = count

            status = ""
            if table in EXPECTED_TABLES and count == 0:
                status = "⚠  EMPTY — expected data here"
            elif table in EXPECTED_TABLES:
                status = "✓"

            count_str = str(count) if count >= 0 else "error"
            print(f"  {table:<25} {count_str:>8}  {status}")

        # ── Missing expected tables ──────────────────────────────────────
        missing = [t for t in EXPECTED_TABLES if t not in all_tables]
        if missing:
            print()
            for t in missing:
                print(f"  {'?':<25} {'N/A':>8}  ✗ TABLE MISSING — '{t}' not created yet")

        # ── Preview key collections ──────────────────────────────────────
        for table, fields in PREVIEW_FIELDS.items():
            if table not in all_tables:
                continue
            count = table_counts.get(table, 0)
            if count == 0:
                continue

            print(f"\n  --- Last 3 records in '{table}' ---")
            try:
                sample_rows = await conn.fetch(
                    f"SELECT data FROM {table} ORDER BY _id DESC LIMIT 3"
                )
            except Exception as e:
                print(f"  (could not query: {e})")
                continue

            for i, row in enumerate(sample_rows, 1):
                try:
                    doc = json.loads(row["data"]) if isinstance(row["data"], str) else dict(row["data"])
                except Exception:
                    doc = {}
                summary = "  " + "  ".join(
                    f"{f}={fmt(doc.get(f))}" for f in fields if doc.get(f) is not None
                )
                print(f"  [{i}] {summary}")

        # ── Summary ──────────────────────────────────────────────────────
        total_rows = sum(c for c in table_counts.values() if c >= 0)
        print(f"\n{'='*65}")
        print(f"  Total tables: {len(all_tables)}   Total rows: {total_rows}")
        if missing:
            print(f"  Missing tables: {', '.join(missing)}")
        empty_expected = [t for t in EXPECTED_TABLES if table_counts.get(t, -1) == 0]
        if empty_expected:
            print(f"  Empty (but expected to have data): {', '.join(empty_expected)}")
            print()
            print("  If these should have data, the MongoDB migration may be incomplete.")
            print("  Check your migration tool's logs or re-run the import.")
        else:
            print("  All expected tables have data. Transfer looks complete.")
        print(f"{'='*65}\n")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
