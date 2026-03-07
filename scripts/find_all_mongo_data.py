"""
find_all_mongo_data.py

Scans ALL databases across up to 3 MongoDB Atlas clusters and reports
every collection that has data. Run this to locate your missing bookings.

Usage (PowerShell):
    python scripts\\find_all_mongo_data.py

Edit the CLUSTERS dict below with your connection strings for Cluster1 & Cluster2.
Get them from: cloud.mongodb.com → your cluster → Connect → Drivers
"""

import pymongo
import sys
from datetime import datetime

# ── EDIT THESE ────────────────────────────────────────────────────────────────
CLUSTERS = {
    "Cluster0": "mongodb+srv://bookaride_db:FDP1PLGG37GOT5Id@cluster0.vte8b8.mongodb.net/?authSource=admin&appName=Cluster0",
    "Cluster1": "PASTE_CLUSTER1_CONNECTION_STRING_HERE",
    "Cluster2": "PASTE_CLUSTER2_CONNECTION_STRING_HERE",
}

# Collections we care most about
KEY_COLLECTIONS = {"bookings", "drivers", "users", "admin_users", "payment_transactions",
                   "bookings_archive", "shuttle_bookings", "hotel_bookings"}

SKIP_DBS = {"admin", "local", "config"}
# ─────────────────────────────────────────────────────────────────────────────


def scan_cluster(name, uri):
    if "PASTE_" in uri:
        print(f"\n  [{name}] Skipped — no connection string provided")
        return {}

    print(f"\n{'='*60}")
    print(f"  Scanning {name}...")
    print(f"{'='*60}")

    try:
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=8000)
        client.admin.command("ping")
    except Exception as e:
        print(f"  ERROR connecting: {e}")
        return {}

    found = {}

    try:
        for db_name in sorted(client.list_database_names()):
            if db_name in SKIP_DBS:
                continue

            db = client[db_name]
            collections = db.list_collection_names()

            if not collections:
                continue

            db_has_data = False
            for col in sorted(collections):
                try:
                    count = db[col].count_documents({})
                except Exception:
                    count = 0

                if count == 0:
                    continue

                if not db_has_data:
                    print(f"\n  DB: {db_name}")
                    db_has_data = True

                flag = " ◄ BOOKINGS FOUND" if col in KEY_COLLECTIONS else ""
                print(f"    {col:<35} {count:>6} docs{flag}")

                # Show a sample record for key collections
                if col in KEY_COLLECTIONS and count > 0:
                    sample = db[col].find_one({}, {"_id": 0})
                    if sample:
                        keys = list(sample.keys())[:8]
                        print(f"      fields: {', '.join(keys)}")
                        # Show a meaningful field if available
                        for field in ("status", "customerName", "pickupAddress", "email", "name"):
                            if field in sample:
                                print(f"      sample {field}: {str(sample[field])[:60]}")
                                break

                found[f"{name}/{db_name}/{col}"] = count

    finally:
        client.close()

    return found


def main():
    print(f"\nBookARide — MongoDB Cluster Scanner")
    print(f"Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    all_found = {}
    for cluster_name, uri in CLUSTERS.items():
        results = scan_cluster(cluster_name, uri)
        all_found.update(results)

    print(f"\n{'='*60}")
    print(f"  SUMMARY — Collections with data")
    print(f"{'='*60}")

    if not all_found:
        print("  No data found across any cluster.")
    else:
        total = 0
        for path, count in sorted(all_found.items()):
            col = path.split("/")[-1]
            flag = " ◄" if col in KEY_COLLECTIONS else ""
            print(f"  {path:<50} {count:>6}{flag}")
            total += count
        print(f"\n  Total documents: {total}")

    print()
    print("  Next step: paste this output back to Claude to plan the import.")
    print()


if __name__ == "__main__":
    main()
