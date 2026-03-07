import asyncio
import logging
import uuid
from datetime import datetime, timezone

import pytz
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.auth import get_current_admin
from app.services.email import (
    send_email,
    send_booking_confirmation,
    send_admin_notification,
    log_email,
)

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


@router.get("/me")
async def get_me(current_admin: dict = Depends(get_current_admin)):
    admin = dict(current_admin)
    admin.pop("hashed_password", None)
    return admin


@router.get("/dashboard")
async def dashboard(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    nz_tz = pytz.timezone("Pacific/Auckland")
    today = datetime.now(nz_tz).strftime("%Y-%m-%d")

    total = await db.bookings.count_documents({})
    todays = await db.bookings.count_documents({"date": today})
    pending = await db.bookings.count_documents({"status": "pending"})
    confirmed = await db.bookings.count_documents({"status": "confirmed"})

    return {
        "total_bookings": total,
        "todays_bookings": todays,
        "pending": pending,
        "confirmed": confirmed,
        "date": today,
    }


@router.get("/system-health")
async def system_health(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    try:
        await asyncio.wait_for(db.command("ping"), timeout=3.0)
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "database": "healthy" if db_ok else "unhealthy",
        "api": "healthy",
    }


@router.get("/customers")
async def list_customers(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)

    customers = {}
    for b in bookings:
        email = b.get("email", "")
        if not email:
            continue
        if email not in customers:
            customers[email] = {
                "email": email,
                "name": b.get("name", ""),
                "phone": b.get("phone", ""),
                "total_bookings": 0,
                "total_spent": 0,
            }
        customers[email]["total_bookings"] += 1
        customers[email]["total_spent"] += b.get("pricing", {}).get("totalPrice", 0)

    return {"customers": list(customers.values())}


# ── Live Pricing (admin tool — no booking created) ──────────────


class LivePriceRequest(BaseModel):
    serviceType: str
    pickupAddress: str
    pickupAddresses: Optional[list] = []
    dropoffAddress: str
    passengers: int = 1
    vipAirportPickup: bool = False
    oversizedLuggage: bool = False
    bookReturn: bool = False


@router.post("/live-pricing")
async def admin_live_pricing(
    request: LivePriceRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """
    Admin live pricing tool — calculates a price quote without creating a booking.
    Used by admin staff to give customers quick price estimates.
    """
    from app.main import db
    from app.routes.pricing import calculate_price, PriceRequest

    price_request = PriceRequest(
        serviceType=request.serviceType,
        pickupAddress=request.pickupAddress,
        pickupAddresses=request.pickupAddresses or [],
        dropoffAddress=request.dropoffAddress,
        passengers=request.passengers,
        vipAirportPickup=request.vipAirportPickup,
        oversizedLuggage=request.oversizedLuggage,
        bookReturn=request.bookReturn,
    )

    result = await calculate_price(price_request)

    # Log the pricing enquiry (not a booking)
    await db.pricing_enquiries.insert_one({
        "id": str(uuid.uuid4()),
        "type": "live_pricing",
        "admin": current_admin.get("username", "unknown"),
        "request": request.dict(),
        "result": result.dict(),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "pricing": result.dict(),
        "note": "This is a price estimate only — no booking has been created.",
    }


@router.get("/pricing-enquiries")
async def list_pricing_enquiries(
    current_admin: dict = Depends(get_current_admin),
):
    """List recent pricing enquiries made through the admin live pricing tool."""
    from app.main import db

    enquiries = (
        await db.pricing_enquiries.find({}, {"_id": 0})
        .sort("createdAt", -1)
        .to_list(100)
    )
    return {"enquiries": enquiries, "total": len(enquiries)}


# ── Email Management ────────────────────────────────────────────


class TestEmailRequest(BaseModel):
    to: str
    subject: Optional[str] = "BookARide — Test Email"
    message: Optional[str] = "This is a test email from the BookARide admin panel."


@router.post("/email/test")
async def send_test_email(
    data: TestEmailRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Send a test email to verify the email delivery system."""
    from app.main import db

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; color: #d4a843; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0;">BookARide</h1>
            <p style="color: #ccc; margin: 8px 0 0;">Email Test</p>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
            <p>{data.message}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
            <p style="font-size: 12px; color: #999;">
                Sent by admin <strong>{current_admin.get('username', 'unknown')}</strong>
                at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
            </p>
        </div>
    </div>
    """

    result = await send_email(to=data.to, subject=data.subject, html=html)
    await log_email(
        db,
        to=data.to,
        subject=data.subject,
        status="sent" if result.get("success") else "failed",
        details={**result, "admin": current_admin.get("username")},
    )

    if result.get("success"):
        return {"message": f"Test email sent to {data.to}", "details": result}
    else:
        raise HTTPException(
            status_code=502,
            detail=f"Email send failed: {result.get('error', 'Unknown error')}",
        )


@router.post("/email/send-confirmation/{booking_id}")
async def resend_booking_confirmation(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Re-send booking confirmation email for a specific booking."""
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    result = await send_booking_confirmation(db, booking)
    if result.get("success"):
        return {
            "message": f"Confirmation email sent to {booking.get('email')}",
            "details": result,
        }
    else:
        raise HTTPException(
            status_code=502,
            detail=f"Email send failed: {result.get('error', 'Unknown error')}",
        )


@router.get("/email/logs")
async def get_email_logs(
    current_admin: dict = Depends(get_current_admin),
):
    """View recent email send logs."""
    from app.main import db

    logs = (
        await db.email_logs.find({}, {"_id": 0})
        .sort("sentAt", -1)
        .to_list(100)
    )
    return {"logs": logs, "total": len(logs)}


# ── Booking lockdown (require confirmation for dangerous actions) ─


# ── Admin Create Booking (on behalf of customer) ──────────────


class AdminBookingCreate(BaseModel):
    serviceType: str
    pickupAddress: str
    pickupAddresses: Optional[list] = []
    dropoffAddress: str
    date: str
    time: str
    passengers: str = "1"
    name: str
    email: str
    phone: str
    notes: Optional[str] = ""
    departureFlightNumber: Optional[str] = ""
    arrivalFlightNumber: Optional[str] = ""
    bookReturn: Optional[bool] = False
    returnDate: Optional[str] = ""
    returnTime: Optional[str] = ""
    returnFlightNumber: Optional[str] = ""
    vipAirportPickup: Optional[bool] = False
    oversizedLuggage: Optional[bool] = False
    # Price override — if set, use this instead of calculated price
    priceOverride: Optional[float] = None
    sendConfirmation: Optional[bool] = True


@router.post("/bookings/create")
async def admin_create_booking(
    data: AdminBookingCreate,
    current_admin: dict = Depends(get_current_admin),
):
    """Create a booking on behalf of a customer. Optionally override the calculated price."""
    from app.main import db
    from app.routes.pricing import calculate_price, PriceRequest
    from app.routes.bookings import get_next_reference_number

    # Calculate price (or use override)
    if data.priceOverride is not None and data.priceOverride > 0:
        pricing = {
            "totalPrice": round(data.priceOverride, 2),
            "priceOverride": True,
            "overrideBy": current_admin.get("username", "unknown"),
        }
    else:
        price_req = PriceRequest(
            serviceType=data.serviceType,
            pickupAddress=data.pickupAddress,
            pickupAddresses=data.pickupAddresses or [],
            dropoffAddress=data.dropoffAddress,
            passengers=int(data.passengers),
            vipAirportPickup=data.vipAirportPickup,
            oversizedLuggage=data.oversizedLuggage,
            bookReturn=data.bookReturn,
        )
        result = await calculate_price(price_req)
        pricing = result.dict()

    # Build booking
    ref_number = await get_next_reference_number()
    booking_id = str(uuid.uuid4())

    booking_dict = {
        "id": booking_id,
        "serviceType": data.serviceType,
        "pickupAddress": data.pickupAddress,
        "pickupAddresses": data.pickupAddresses or [],
        "dropoffAddress": data.dropoffAddress,
        "date": data.date,
        "time": data.time,
        "passengers": data.passengers,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "notes": data.notes or "",
        "departureFlightNumber": data.departureFlightNumber or "",
        "arrivalFlightNumber": data.arrivalFlightNumber or "",
        "bookReturn": data.bookReturn,
        "returnDate": data.returnDate or "",
        "returnTime": data.returnTime or "",
        "returnFlightNumber": data.returnFlightNumber or "",
        "vipAirportPickup": data.vipAirportPickup,
        "oversizedLuggage": data.oversizedLuggage,
        "pricing": pricing,
        "totalPrice": pricing.get("totalPrice", 0),
        "referenceNumber": str(ref_number),
        "status": "confirmed",
        "payment_status": "unpaid",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "createdBy": current_admin.get("username", "admin"),
        "source": "admin",
    }

    await db.bookings.insert_one(booking_dict)
    logger.info(
        f"Admin {current_admin.get('username')} created booking #{ref_number} for {data.name}"
    )

    # Send confirmation email to customer + admin notification
    if data.sendConfirmation:
        await send_booking_confirmation(db, booking_dict)
        await send_admin_notification(db, booking_dict)

    return {
        "message": f"Booking #{ref_number} created for {data.name}",
        "booking": booking_dict,
    }


# ── Price Override on existing booking ─────────────────────────


class PriceOverrideRequest(BaseModel):
    totalPrice: float
    reason: Optional[str] = ""


@router.patch("/bookings/{booking_id}/price-override")
async def override_booking_price(
    booking_id: str,
    data: PriceOverrideRequest,
    current_admin: dict = Depends(get_current_admin),
):
    """Override the price on an existing booking."""
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    old_price = booking.get("totalPrice", 0)
    new_pricing = booking.get("pricing", {})
    new_pricing["originalTotalPrice"] = old_price
    new_pricing["totalPrice"] = round(data.totalPrice, 2)
    new_pricing["priceOverride"] = True
    new_pricing["overrideBy"] = current_admin.get("username", "unknown")
    new_pricing["overrideReason"] = data.reason or ""
    new_pricing["overrideAt"] = datetime.now(timezone.utc).isoformat()

    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "pricing": new_pricing,
            "totalPrice": round(data.totalPrice, 2),
        }},
    )

    logger.info(
        f"Admin {current_admin.get('username')} overrode price on {booking_id}: "
        f"${old_price} -> ${data.totalPrice} ({data.reason})"
    )

    return {
        "message": f"Price updated from ${old_price:.2f} to ${data.totalPrice:.2f}",
        "old_price": old_price,
        "new_price": round(data.totalPrice, 2),
    }


@router.post("/bookings/{booking_id}/confirm")
async def confirm_booking(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Confirm a pending booking and send confirmation email."""
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.get("status") == "confirmed":
        return {"message": "Booking is already confirmed"}

    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "status": "confirmed",
            "confirmedAt": datetime.now(timezone.utc).isoformat(),
            "confirmedBy": current_admin.get("username"),
        }},
    )

    # Send confirmation email
    updated_booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    email_result = await send_booking_confirmation(db, updated_booking)

    return {
        "message": "Booking confirmed",
        "email_sent": email_result.get("success", False),
    }


@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    reason: dict = None,
    current_admin: dict = Depends(get_current_admin),
):
    """Cancel a booking. Requires admin authentication."""
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.get("status") == "cancelled":
        return {"message": "Booking is already cancelled"}

    cancel_reason = (reason or {}).get("reason", "Cancelled by admin")
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "status": "cancelled",
            "cancelledAt": datetime.now(timezone.utc).isoformat(),
            "cancelledBy": current_admin.get("username"),
            "cancelReason": cancel_reason,
        }},
    )

    return {"message": "Booking cancelled", "reason": cancel_reason}
