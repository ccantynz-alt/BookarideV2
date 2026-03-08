import logging
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from app.core.auth import get_current_admin
from app.core.config import settings
from app.services.email import (
    send_booking_confirmation,
    send_operator_new_booking,
    send_email,
    _base_template,
    _row,
)

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


@router.post("/send-payment-link/{booking_id}")
async def send_payment_link(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Create a Stripe checkout session for a booking and email the payment link to the customer."""
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Booking is already paid")

    stripe_key = settings.STRIPE_SECRET_KEY
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    import stripe

    stripe.api_key = stripe_key
    total_price = booking.get("totalPrice") or booking.get("pricing", {}).get("totalPrice", 0)
    amount_cents = int(float(total_price) * 100)

    if amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Booking has no price set")

    ref = booking.get("referenceNumber", "N/A")

    checkout_session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": "nzd",
                    "product_data": {
                        "name": f"BookARide — Ref #{ref}",
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

    # Store transaction
    await db.payment_transactions.insert_one(
        {
            "id": checkout_session.id,
            "booking_id": booking_id,
            "amount": total_price,
            "currency": "nzd",
            "status": "pending",
            "stripe_session_id": checkout_session.id,
            "type": "payment_link",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "sent_by": current_admin.get("username", "admin"),
        }
    )

    # Build and send payment link email
    name = booking.get("name", "").split()[0] or "Customer"
    pickup = booking.get("pickupAddress", "")
    dropoff = booking.get("dropoffAddress", "")
    date = booking.get("date", "")
    time = booking.get("time", "")
    payment_url = checkout_session.url

    body = f"""
    <h2 style="margin:0 0 8px;font-size:24px;color:#111;">Your booking is ready for payment</h2>
    <p style="color:#666;margin:0 0 28px;font-size:15px;">Hi {name}, please complete your payment to confirm your transfer.</p>

    <div style="background:#f9f6ee;border:1.5px solid #D4AF37;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
      <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Booking Reference</div>
      <div style="font-size:32px;font-weight:800;color:#D4AF37;letter-spacing:2px;">#{ref}</div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      {_row("Pickup", pickup)}
      {_row("Drop-off", dropoff)}
      {_row("Date", date)}
      {_row("Time", time)}
      {_row("Amount Due", f"${float(total_price):.2f} NZD")}
    </table>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="{payment_url}" style="display:inline-block;background:#D4AF37;color:#000;font-weight:700;padding:16px 48px;border-radius:8px;text-decoration:none;font-size:16px;">Pay Now →</a>
    </div>

    <div style="background:#fff9e6;border-left:4px solid #D4AF37;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;">
      <p style="color:#92400e;font-size:13px;margin:0;">This payment link expires in 24 hours. After payment, you'll receive a full booking confirmation.</p>
    </div>
    """

    email = booking.get("email")
    success = await send_email(
        to=email,
        subject=f"BookARide — Pay for Booking #{ref}",
        html=_base_template(f"Payment Request #{ref}", body),
    )

    if not success:
        raise HTTPException(
            status_code=502,
            detail="Failed to send payment email — check Mailgun configuration",
        )

    return {
        "message": f"Payment link sent to {email}",
        "checkout_url": payment_url,
        "session_id": checkout_session.id,
    }
