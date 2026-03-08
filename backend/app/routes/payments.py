import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings

router = APIRouter(prefix="/payment", tags=["Payments"])
logger = logging.getLogger(__name__)


@router.get("/success")
async def payment_success(booking_id: str):
    """Public endpoint — fetch booking details after Stripe redirect."""
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"booking": booking}


@router.post("/create-checkout")
async def create_checkout(data: dict):
    from app.main import db

    booking_id = data.get("booking_id")
    if not booking_id:
        raise HTTPException(status_code=400, detail="booking_id required")

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    stripe_key = settings.STRIPE_SECRET_KEY
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    import stripe

    stripe.api_key = stripe_key
    total_price = booking.get("totalPrice") or booking.get("pricing", {}).get("totalPrice", 0)
    amount_cents = int(float(total_price) * 100)

    checkout_session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": "nzd",
                    "product_data": {
                        "name": f"BookARide — Ref #{booking.get('referenceNumber', 'N/A')}",
                        "description": f"{booking.get('pickupAddress', '')} → {booking.get('dropoffAddress', '')}",
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }
        ],
        customer_email=booking.get("email"),
        success_url=f"{settings.PUBLIC_DOMAIN}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&booking_id={booking_id}",
        cancel_url=f"{settings.PUBLIC_DOMAIN}/book-now?cancelled=true",
        metadata={"booking_id": booking_id},
    )

    await db.payment_transactions.insert_one(
        {
            "id": checkout_session.id,
            "booking_id": booking_id,
            "amount": total_price,
            "currency": "nzd",
            "status": "pending",
            "stripe_session_id": checkout_session.id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    return {"url": checkout_session.url, "session_id": checkout_session.id}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from app.main import db

    payload = await request.body()
    sig = request.headers.get("stripe-signature")

    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        event = stripe.Webhook.construct_event(
            payload, sig, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        booking_id = session.get("metadata", {}).get("booking_id")
        if booking_id:
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {"payment_status": "paid", "status": "confirmed"}},
            )
            await db.payment_transactions.update_one(
                {"stripe_session_id": session["id"]},
                {"$set": {"status": "completed"}},
            )
            logger.info(f"Payment confirmed for booking {booking_id}")

            # Fire email + SMS notifications
            booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
            if booking:
                try:
                    import asyncio
                    from app.services.email import send_booking_confirmation, send_operator_new_booking
                    from app.services.sms import send_booking_confirmation_sms, send_operator_sms

                    await asyncio.gather(
                        send_booking_confirmation(booking),
                        send_operator_new_booking(booking),
                        send_booking_confirmation_sms(booking),
                        send_operator_sms(booking),
                        return_exceptions=True,
                    )
                except Exception as e:
                    logger.error(f"Notification error for booking {booking_id}: {e}")

    return {"received": True}


@router.get("/payment/success")
async def payment_success(session_id: str = "", booking_id: str = ""):
    """Retrieve booking details for the success page after payment or direct booking."""
    from app.main import db

    booking = None

    if session_id:
        # Look up by Stripe session ID
        txn = await db.payment_transactions.find_one(
            {"stripe_session_id": session_id}, {"_id": 0}
        )
        if txn:
            booking = await db.bookings.find_one(
                {"id": txn["booking_id"]}, {"_id": 0}
            )
    elif booking_id:
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {
        "booking": {
            "id": booking.get("id"),
            "reference": booking.get("referenceNumber"),
            "pickup_address": booking.get("pickupAddress"),
            "dropoff_address": booking.get("dropoffAddress"),
            "pickup_date": booking.get("date"),
            "pickup_time": booking.get("time"),
            "passengers": booking.get("passengers"),
            "total_price": booking.get("pricing", {}).get("totalPrice"),
            "email": booking.get("email"),
            "status": booking.get("status"),
            "payment_status": booking.get("payment_status"),
        }
    }
