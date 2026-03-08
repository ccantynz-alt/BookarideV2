"""Twilio SMS service — booking confirmations, reminders and operator alerts."""
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def _client():
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        return None
    from twilio.rest import Client
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


async def send_sms(to: str, body: str) -> bool:
    """Send SMS via Twilio. Returns True on success."""
    if not settings.TWILIO_PHONE_NUMBER:
        logger.warning("Twilio not configured — SMS not sent")
        return False
    # Normalise NZ numbers
    number = to.strip().replace(" ", "")
    if number.startswith("0") and len(number) <= 11:
        number = "+64" + number[1:]
    if not number.startswith("+"):
        number = "+" + number
    try:
        client = _client()
        if not client:
            logger.warning("Twilio credentials missing — SMS not sent")
            return False
        msg = client.messages.create(
            body=body,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=number,
        )
        logger.info(f"SMS sent to {number}: SID {msg.sid}")
        return True
    except Exception as e:
        logger.error(f"SMS send failed to {number}: {e}")
        return False


async def send_booking_confirmation_sms(booking: dict) -> bool:
    phone = booking.get("phone", "")
    if not phone:
        return False
    ref = booking.get("referenceNumber", booking.get("id", "N/A"))
    date = booking.get("date", "")
    time = booking.get("time", "")
    pickup = booking.get("pickupAddress", "")
    # Truncate long addresses
    if len(pickup) > 50:
        pickup = pickup[:50] + "..."
    body = (
        f"BookARide Confirmed! Ref #{ref}\n"
        f"Pickup: {date} at {time}\n"
        f"From: {pickup}\n"
        f"Questions? 021 880 793"
    )
    return await send_sms(phone, body)


async def send_reminder_sms(booking: dict) -> bool:
    phone = booking.get("phone", "")
    if not phone:
        return False
    ref = booking.get("referenceNumber", booking.get("id", "N/A"))
    time = booking.get("time", "")
    pickup = booking.get("pickupAddress", "")
    if len(pickup) > 50:
        pickup = pickup[:50] + "..."
    body = (
        f"BookARide Reminder: Your transfer is TOMORROW at {time}.\n"
        f"Pickup: {pickup}\n"
        f"Ref #{ref} — Call 021 880 793 for changes."
    )
    return await send_sms(phone, body)


async def send_operator_sms(booking: dict) -> bool:
    """Alert operator via SMS of a new confirmed booking."""
    operator_number = settings.TWILIO_PHONE_NUMBER  # Use a separate OPERATOR_PHONE env if preferred
    if not operator_number:
        return False
    ref = booking.get("referenceNumber", booking.get("id", "N/A"))
    name = booking.get("name", "Unknown")
    phone = booking.get("phone", "")
    date = booking.get("date", "")
    time = booking.get("time", "")
    total = booking.get("totalPrice") or booking.get("pricing", {}).get("totalPrice", 0)
    body = (
        f"NEW BOOKING #{ref}\n"
        f"{name} | {phone}\n"
        f"{date} at {time}\n"
        f"${float(total):.2f} NZD"
    )
    # Send to operator's phone — use OPERATOR_PHONE env var if set, else skip
    import os
    op_phone = os.environ.get("OPERATOR_PHONE", "")
    if not op_phone:
        logger.info("OPERATOR_PHONE not set — skipping operator SMS")
        return False
    return await send_sms(op_phone, body)
