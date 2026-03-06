"""
Email service using Mailgun API.
Sends booking confirmations, admin notifications, and test emails.
"""

import logging
import uuid
from datetime import datetime, timezone

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html: str, text: str = "") -> dict:
    """Send an email via Mailgun API. Returns the Mailgun response or error info."""
    api_key = settings.MAILGUN_API_KEY
    domain = settings.MAILGUN_DOMAIN

    if not api_key:
        logger.warning("MAILGUN_API_KEY not set — email not sent")
        return {"success": False, "error": "Mailgun API key not configured"}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.mailgun.net/v3/{domain}/messages",
                auth=("api", api_key),
                data={
                    "from": f"BookARide <noreply@{domain}>",
                    "to": [to],
                    "subject": subject,
                    "html": html,
                    "text": text or subject,
                },
                timeout=10.0,
            )
            if resp.status_code == 200:
                logger.info(f"Email sent to {to}: {subject}")
                return {"success": True, "status_code": 200, "data": resp.json()}
            else:
                logger.error(f"Mailgun error {resp.status_code}: {resp.text}")
                return {
                    "success": False,
                    "status_code": resp.status_code,
                    "error": resp.text,
                }
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return {"success": False, "error": str(e)}


async def log_email(db, to: str, subject: str, status: str, details: dict = None):
    """Log an email send attempt to the database."""
    await db.email_logs.insert_one({
        "id": str(uuid.uuid4()),
        "to": to,
        "subject": subject,
        "status": status,
        "details": details or {},
        "sentAt": datetime.now(timezone.utc).isoformat(),
    })


def build_booking_confirmation_html(booking: dict) -> str:
    """Build HTML email for booking confirmation."""
    ref = booking.get("referenceNumber", "N/A")
    name = booking.get("name", "Customer")
    pickup = booking.get("pickupAddress", "")
    dropoff = booking.get("dropoffAddress", "")
    date = booking.get("date", "")
    time = booking.get("time", "")
    passengers = booking.get("passengers", "1")
    pricing = booking.get("pricing", {})
    total = pricing.get("totalPrice", 0)
    status = booking.get("status", "pending").title()
    payment = booking.get("payment_status", "unpaid").title()

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }}
            .header {{ background: #1a1a2e; color: #d4a843; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .body {{ padding: 24px; }}
            .row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
            .row-label {{ color: #666; font-size: 14px; }}
            .row-value {{ color: #333; font-weight: 600; font-size: 14px; }}
            .total {{ background: #f8f8f8; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0; }}
            .total-amount {{ font-size: 28px; color: #d4a843; font-weight: bold; }}
            .footer {{ background: #f8f8f8; padding: 16px; text-align: center; font-size: 12px; color: #999; }}
            .badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }}
            .badge-pending {{ background: #fff3cd; color: #856404; }}
            .badge-confirmed {{ background: #d4edda; color: #155724; }}
            .badge-paid {{ background: #d4edda; color: #155724; }}
            .badge-unpaid {{ background: #f8d7da; color: #721c24; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BookARide</h1>
                <p style="margin: 8px 0 0; color: #ccc;">Booking Confirmation</p>
            </div>
            <div class="body">
                <p>Hi {name},</p>
                <p>Thank you for your booking. Here are your details:</p>

                <div style="margin: 20px 0;">
                    <div class="row">
                        <span class="row-label">Reference</span>
                        <span class="row-value">#{ref}</span>
                    </div>
                    <div class="row">
                        <span class="row-label">Pickup</span>
                        <span class="row-value">{pickup}</span>
                    </div>
                    <div class="row">
                        <span class="row-label">Drop-off</span>
                        <span class="row-value">{dropoff}</span>
                    </div>
                    <div class="row">
                        <span class="row-label">Date & Time</span>
                        <span class="row-value">{date} at {time}</span>
                    </div>
                    <div class="row">
                        <span class="row-label">Passengers</span>
                        <span class="row-value">{passengers}</span>
                    </div>
                    <div class="row">
                        <span class="row-label">Status</span>
                        <span class="row-value"><span class="badge badge-{status.lower()}">{status}</span></span>
                    </div>
                    <div class="row">
                        <span class="row-label">Payment</span>
                        <span class="row-value"><span class="badge badge-{payment.lower()}">{payment}</span></span>
                    </div>
                </div>

                <div class="total">
                    <div style="color: #666; font-size: 14px;">Total Amount</div>
                    <div class="total-amount">${total:.2f} NZD</div>
                </div>

                <p style="font-size: 14px; color: #666;">
                    If you have any questions, please contact us at
                    <a href="mailto:info@bookaride.co.nz">info@bookaride.co.nz</a>
                    or call us.
                </p>
            </div>
            <div class="footer">
                <p>BookARide NZ &mdash; Premium Airport & Point-to-Point Transfers</p>
                <p>&copy; {datetime.now().year} BookARide. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


async def send_booking_confirmation(db, booking: dict) -> dict:
    """Send booking confirmation email to the customer."""
    email = booking.get("email")
    if not email:
        return {"success": False, "error": "No email address on booking"}

    ref = booking.get("referenceNumber", "N/A")
    html = build_booking_confirmation_html(booking)
    result = await send_email(
        to=email,
        subject=f"BookARide - Booking Confirmation #{ref}",
        html=html,
    )

    await log_email(
        db,
        to=email,
        subject=f"Booking Confirmation #{ref}",
        status="sent" if result.get("success") else "failed",
        details=result,
    )
    return result


async def send_admin_notification(db, booking: dict) -> dict:
    """Send new booking notification to admin."""
    admin_email = "info@bookaride.co.nz"
    ref = booking.get("referenceNumber", "N/A")
    name = booking.get("name", "Unknown")
    pickup = booking.get("pickupAddress", "")
    dropoff = booking.get("dropoffAddress", "")
    total = booking.get("pricing", {}).get("totalPrice", 0)

    html = f"""
    <h2>New Booking #{ref}</h2>
    <p><strong>Customer:</strong> {name}</p>
    <p><strong>From:</strong> {pickup}</p>
    <p><strong>To:</strong> {dropoff}</p>
    <p><strong>Total:</strong> ${total:.2f} NZD</p>
    <p><a href="{settings.PUBLIC_DOMAIN}/admin/bookings">View in Admin Panel</a></p>
    """

    result = await send_email(
        to=admin_email,
        subject=f"New Booking #{ref} from {name}",
        html=html,
    )

    await log_email(
        db,
        to=admin_email,
        subject=f"Admin notification: Booking #{ref}",
        status="sent" if result.get("success") else "failed",
        details=result,
    )
    return result
