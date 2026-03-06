import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.core.auth import get_current_admin
from app.models.booking import Booking, BookingCreate

router = APIRouter(tags=["Bookings"])
logger = logging.getLogger(__name__)


async def get_next_reference_number():
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


@router.post("/bookings")
async def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks):
    from app.main import db

    booking_obj = Booking(**booking.dict())
    booking_dict = booking_obj.dict()

    if booking.returnDepartureFlightNumber:
        booking_dict["returnDepartureFlightNumber"] = booking.returnDepartureFlightNumber
        booking_dict["returnFlightNumber"] = booking.returnDepartureFlightNumber

    ref_number = await get_next_reference_number()
    booking_dict["referenceNumber"] = str(ref_number)

    booking_dict["totalPrice"] = booking.pricing.get("totalPrice", 0)
    booking_dict["payment_status"] = "unpaid"

    result = await db.bookings.insert_one(booking_dict)
    if not result.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to save booking")

    logger.info(f"Booking created: {booking_obj.id} ref #{ref_number}")

    # Send confirmation emails in background
    from app.services.email import send_booking_confirmation, send_admin_notification

    background_tasks.add_task(send_booking_confirmation, db, booking_dict)
    background_tasks.add_task(send_admin_notification, db, booking_dict)

    return booking_dict


@router.get("/bookings")
async def list_bookings(
    status: str = None,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    query = {}
    if status:
        query["status"] = status

    bookings = await db.bookings.find(query, {"_id": 0}).to_list(10000)
    total = await db.bookings.count_documents(query)
    return {"bookings": bookings, "total": total}


@router.get("/bookings/count")
async def booking_counts(current_admin: dict = Depends(get_current_admin)):
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


@router.patch("/bookings/{booking_id}")
async def update_booking(
    booking_id: str,
    updates: dict,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    result = await db.bookings.update_one({"id": booking_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking updated", "modified_count": result.modified_count}


@router.delete("/bookings/{booking_id}")
async def delete_booking(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking["deletedAt"] = datetime.now(timezone.utc).isoformat()
    await db.deleted_bookings.insert_one(booking)
    await db.bookings.delete_one({"id": booking_id})
    return {"message": "Booking deleted"}
