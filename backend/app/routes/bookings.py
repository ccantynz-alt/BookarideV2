"""
BookARide V2 — Booking Routes
Bulletproof CRUD with state machine enforcement and idempotency protection.
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import ValidationError

from app.core.auth import get_current_admin
from app.models.booking import (
    Booking,
    BookingCreate,
    validate_status_transition,
    get_allowed_transitions,
    VALID_STATUSES,
)

router = APIRouter(tags=["Bookings"])
logger = logging.getLogger(__name__)

# In-memory idempotency cache (TTL managed by cleanup, good enough for single-instance)
_idempotency_cache: dict[str, str] = {}
MAX_IDEMPOTENCY_CACHE = 1000


# ── Helpers ──────────────────────────────────────────────────────

async def get_next_reference_number():
    """Atomically increment and return the next booking reference number."""
    from app.main import db

    counter = await db.counters.find_one_and_update(
        {"id": "booking_reference"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    if counter is None or counter.get("seq", 0) < 10:
        await db.counters.update_one(
            {"id": "booking_reference"},
            {"$set": {"seq": 10}},
            upsert=True,
        )
        return 10
    return counter.get("seq", 10)


def _trim_idempotency_cache():
    """Keep the cache from growing unbounded."""
    global _idempotency_cache
    if len(_idempotency_cache) > MAX_IDEMPOTENCY_CACHE:
        # Remove oldest half
        keys = list(_idempotency_cache.keys())
        for k in keys[: len(keys) // 2]:
            _idempotency_cache.pop(k, None)


# ── Create Booking ───────────────────────────────────────────────

@router.post("/bookings")
async def create_booking(
    request: Request,
    booking: BookingCreate,
    background_tasks: BackgroundTasks,
):
    """
    Create a new booking.

    Idempotency: If the client sends an X-Idempotency-Key header,
    duplicate requests return the existing booking instead of creating a new one.
    """
    from app.main import db

    # ── Idempotency check ────────────────────────────────────
    idempotency_key = request.headers.get("x-idempotency-key", "").strip()
    if idempotency_key and idempotency_key in _idempotency_cache:
        existing_id = _idempotency_cache[idempotency_key]
        existing = await db.bookings.find_one({"id": existing_id}, {"_id": 0})
        if existing:
            logger.info(f"Idempotent duplicate blocked: {idempotency_key} → {existing_id}")
            return existing

    # ── Create booking object ────────────────────────────────
    booking_obj = Booking(**booking.model_dump())
    booking_dict = booking_obj.model_dump()

    # Ensure return flight number consistency
    if booking.returnDepartureFlightNumber:
        booking_dict["returnDepartureFlightNumber"] = booking.returnDepartureFlightNumber
        booking_dict["returnFlightNumber"] = booking.returnDepartureFlightNumber

    # Assign reference number
    ref_number = await get_next_reference_number()
    booking_dict["referenceNumber"] = str(ref_number)

    # Extract totalPrice for easy querying
    booking_dict["totalPrice"] = booking.pricing.get("totalPrice", 0)
    booking_dict["payment_status"] = "unpaid"

    # ── Persist ──────────────────────────────────────────────
    result = await db.bookings.insert_one(booking_dict)
    if not result.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to save booking — please try again")

    logger.info(f"Booking created: {booking_obj.id} ref #{ref_number}")

    # ── Cache idempotency key ────────────────────────────────
    if idempotency_key:
        _idempotency_cache[idempotency_key] = booking_obj.id
        _trim_idempotency_cache()

    # ── Background notifications ─────────────────────────────
    from app.services.email import send_booking_pending, send_operator_new_booking

    background_tasks.add_task(send_booking_pending, booking_dict)
    background_tasks.add_task(send_operator_new_booking, booking_dict)

    return booking_dict


# ── List Bookings (Admin) ───────────────────────────────────────

@router.get("/bookings")
async def list_bookings(
    status: str = None,
    current_admin: dict = Depends(get_current_admin),
):
    """List all bookings, optionally filtered by status."""
    from app.main import db

    query = {}
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status filter '{status}'. Must be one of: {VALID_STATUSES}",
            )
        query["status"] = status

    bookings = await db.bookings.find(query, {"_id": 0}).to_list(10000)
    total = await db.bookings.count_documents(query)
    return {"bookings": bookings, "total": total}


# ── Booking Counts (Admin) ──────────────────────────────────────

@router.get("/bookings/count")
async def booking_counts(current_admin: dict = Depends(get_current_admin)):
    """Get booking statistics by status."""
    from app.main import db

    total = await db.bookings.count_documents({})
    pending = await db.bookings.count_documents({"status": "pending"})
    confirmed = await db.bookings.count_documents({"status": "confirmed"})
    completed = await db.bookings.count_documents({"status": "completed"})
    cancelled = await db.bookings.count_documents({"status": "cancelled"})
    return {
        "total": total,
        "pending": pending,
        "confirmed": confirmed,
        "completed": completed,
        "cancelled": cancelled,
    }


# ── Update Booking (Admin) ──────────────────────────────────────

@router.patch("/bookings/{booking_id}")
async def update_booking(
    booking_id: str,
    updates: dict,
    current_admin: dict = Depends(get_current_admin),
):
    """
    Update booking fields. Enforces state machine for status changes.
    """
    from app.main import db

    # Fetch existing booking
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # ── Enforce state machine on status changes ──────────────
    if "status" in updates:
        new_status = updates["status"]
        current_status = booking.get("status", "pending")

        if new_status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{new_status}'. Must be one of: {list(VALID_STATUSES)}",
            )

        if not validate_status_transition(current_status, new_status):
            allowed = get_allowed_transitions(current_status)
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot change status from '{current_status}' to '{new_status}'. "
                    f"Allowed transitions: {list(allowed) if allowed else 'none (terminal state)'}"
                ),
            )

    # ── Prevent modification of immutable fields ─────────────
    immutable = {"id", "referenceNumber", "createdAt"}
    for field in immutable:
        if field in updates:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot modify immutable field '{field}'",
            )

    # Add audit trail
    updates["updatedAt"] = datetime.now(timezone.utc).isoformat()
    updates["updatedBy"] = current_admin.get("username", "admin")

    result = await db.bookings.update_one({"id": booking_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")

    logger.info(
        f"Booking {booking_id} updated by {current_admin.get('username')}: "
        f"{list(updates.keys())}"
    )
    return {"message": "Booking updated", "modified_count": result.modified_count}


# ── Delete Booking (Admin) ──────────────────────────────────────

@router.delete("/bookings/{booking_id}")
async def delete_booking(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Soft-delete: archive to deleted_bookings, then remove from active bookings."""
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Archive with deletion metadata
    booking["deletedAt"] = datetime.now(timezone.utc).isoformat()
    booking["deletedBy"] = current_admin.get("username", "admin")
    await db.deleted_bookings.insert_one(booking)
    await db.bookings.delete_one({"id": booking_id})

    logger.info(f"Booking {booking_id} deleted by {current_admin.get('username')}")
    return {"message": "Booking deleted and archived"}
