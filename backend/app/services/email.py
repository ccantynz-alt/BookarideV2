"""Mailgun email service — booking confirmations and operator alerts."""
import logging
from datetime import datetime

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

OPERATOR_EMAIL = "info@bookaride.co.nz"
OPERATOR_NAME = "BookARide Operations"


def _gold(text: str) -> str:
    return f'<span style="color:#D4AF37;font-weight:600">{text}</span>'


def _base_template(title: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#111 0%,#1a1a1a 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#D4AF37;">BOOK A RIDE</div>
            <div style="font-size:12px;color:#999;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">Auckland Airport Transfers</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            {body_html}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:13px;color:#999;">
              Questions? Call <a href="tel:+6421880793" style="color:#D4AF37;text-decoration:none;font-weight:600;">021 880 793</a>
              or email <a href="mailto:info@bookaride.co.nz" style="color:#D4AF37;text-decoration:none;">info@bookaride.co.nz</a>
            </p>
            <p style="margin:8px 0 0;font-size:12px;color:#ccc;">&copy; {datetime.now().year} BookARide NZ · Auckland, New Zealand</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _row(label: str, value: str) -> str:
    if not value:
        return ""
    return f"""
    <tr>
      <td style="padding:8px 0;color:#888;font-size:14px;width:40%;vertical-align:top;">{label}</td>
      <td style="padding:8px 0;color:#222;font-size:14px;font-weight:500;">{value}</td>
    </tr>"""


async def send_email(to: str, subject: str, html: str) -> bool:
    """Send email via Mailgun HTTP API. Returns True on success."""
    if not settings.MAILGUN_API_KEY or not settings.MAILGUN_DOMAIN:
        logger.warning("Mailgun not configured — email not sent")
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
                auth=("api", settings.MAILGUN_API_KEY),
                data={
                    "from": f"BookARide <noreply@{settings.MAILGUN_DOMAIN}>",
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
            )
        if resp.status_code in (200, 201):
            logger.info(f"Email sent to {to}: {subject}")
            return True
        logger.error(f"Mailgun error {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Email send failed: {e}")
    return False


async def send_booking_confirmation(booking: dict) -> bool:
    """Send booking confirmation email to customer after payment."""
    email = booking.get("email", "")
    if not email:
        return False

    ref = booking.get("referenceNumber", booking.get("id", "N/A"))
    name = booking.get("name", "").split()[0] or "there"
    pickup = booking.get("pickupAddress", "")
    dropoff = booking.get("dropoffAddress", "")
    date = booking.get("date", "")
    time = booking.get("time", "")
    passengers = booking.get("passengers", "1")
    total = booking.get("totalPrice") or booking.get("pricing", {}).get("totalPrice", 0)
    return_date = booking.get("returnDate", "")
    vip = booking.get("vipAirportPickup", False)
    oversized = booking.get("oversizedLuggage", False)

    extras = ""
    if vip:
        extras += _row("VIP Pickup", "Included")
    if oversized:
        extras += _row("Oversized Luggage", "Included")
    if return_date:
        extras += _row("Return Trip", f"{return_date} at {booking.get('returnTime', '')}")

    body = f"""
    <h2 style="margin:0 0 8px;font-size:24px;color:#111;">Your booking is confirmed! 🎉</h2>
    <p style="color:#666;margin:0 0 28px;font-size:15px;">Hi {name}, your transfer is locked in. Here's everything you need to know.</p>

    <div style="background:#f9f6ee;border:1.5px solid #D4AF37;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
      <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Booking Reference</div>
      <div style="font-size:32px;font-weight:800;color:#D4AF37;letter-spacing:2px;">#{ref}</div>
      <div style="font-size:13px;color:#666;margin-top:4px;">Keep this for your records</div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      {_row("Pickup", pickup)}
      {_row("Drop-off", dropoff)}
      {_row("Date", date)}
      {_row("Time", time)}
      {_row("Passengers", str(passengers))}
      {extras}
      {_row("Total Paid", f"${float(total):.2f} NZD")}
    </table>

    <div style="background:#f0f9f0;border-left:4px solid #22c55e;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:28px;">
      <strong style="color:#166534;font-size:14px;">✓ Your driver will contact you before pickup.</strong>
      <p style="color:#166534;font-size:13px;margin:6px 0 0;">If your plans change, call us on 021 880 793 (free cancellation up to 24 hours before).</p>
    </div>

    <p style="color:#888;font-size:13px;margin:0;">
      Flight delayed? No worries — we monitor all flights and adjust accordingly.
    </p>
    """

    return await send_email(
        to=email,
        subject=f"Booking Confirmed — #{ref} · BookARide NZ",
        html=_base_template(f"Booking Confirmed #{ref}", body),
    )


async def send_booking_pending(booking: dict) -> bool:
    """Send 'booking received, awaiting payment' email to customer."""
    email = booking.get("email", "")
    if not email:
        return False

    ref = booking.get("referenceNumber", booking.get("id", "N/A"))
    name = booking.get("name", "").split()[0] or "there"
    total = booking.get("totalPrice") or booking.get("pricing", {}).get("totalPrice", 0)

    body = f"""
    <h2 style="margin:0 0 8px;font-size:24px;color:#111;">We've received your booking request</h2>
    <p style="color:#666;margin:0 0 28px;font-size:15px;">Hi {name}, we're waiting for payment confirmation from Stripe. You'll receive a full confirmation email once payment is processed.</p>

    <div style="background:#fff9e6;border:1.5px solid #D4AF37;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
      <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Reference</div>
      <div style="font-size:28px;font-weight:800;color:#D4AF37;">#{ref}</div>
    </div>

    <p style="color:#888;font-size:13px;margin:0;">
      If you have any issues, please contact us at <a href="mailto:info@bookaride.co.nz" style="color:#D4AF37;">info@bookaride.co.nz</a> quoting reference <strong>#{ref}</strong>.
    </p>
    """

    return await send_email(
        to=email,
        subject=f"Booking Request Received — #{ref}",
        html=_base_template(f"Booking Received #{ref}", body),
    )


async def send_operator_new_booking(booking: dict) -> bool:
    """Alert operator of a new confirmed paid booking."""
    ref = booking.get("referenceNumber", booking.get("id", "N/A"))
    name = booking.get("name", "Unknown")
    phone = booking.get("phone", "")
    email_addr = booking.get("email", "")
    pickup = booking.get("pickupAddress", "")
    dropoff = booking.get("dropoffAddress", "")
    date = booking.get("date", "")
    time = booking.get("time", "")
    passengers = booking.get("passengers", "1")
    total = booking.get("totalPrice") or booking.get("pricing", {}).get("totalPrice", 0)
    notes = booking.get("notes", "")

    body = f"""
    <h2 style="margin:0 0 8px;font-size:22px;color:#111;">🚗 New Confirmed Booking — #{ref}</h2>
    <p style="color:#666;margin:0 0 24px;font-size:14px;">A new booking has been paid and confirmed via Stripe.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
      {_row("Ref", f"#{ref}")}
      {_row("Customer", name)}
      {_row("Phone", phone)}
      {_row("Email", email_addr)}
      {_row("Pickup", pickup)}
      {_row("Drop-off", dropoff)}
      {_row("Date", date)}
      {_row("Time", time)}
      {_row("Passengers", str(passengers))}
      {_row("Total", f"${float(total):.2f} NZD")}
      {_row("Notes", notes) if notes else ""}
    </table>

    <a href="{settings.PUBLIC_DOMAIN}/admin/dashboard" style="display:inline-block;background:#D4AF37;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;">View in Admin Dashboard →</a>
    """

    return await send_email(
        to=OPERATOR_EMAIL,
        subject=f"🚗 New Booking #{ref} — {name} — ${float(total):.2f}",
        html=_base_template(f"New Booking #{ref}", body),
    )


async def send_reminder_email(booking: dict) -> bool:
    """24h pickup reminder email to customer."""
    email = booking.get("email", "")
    if not email:
        return False

    ref = booking.get("referenceNumber", booking.get("id", "N/A"))
    name = booking.get("name", "").split()[0] or "there"
    pickup = booking.get("pickupAddress", "")
    time = booking.get("time", "")
    date = booking.get("date", "")

    body = f"""
    <h2 style="margin:0 0 8px;font-size:24px;color:#111;">Your transfer is tomorrow! ⏰</h2>
    <p style="color:#666;margin:0 0 28px;font-size:15px;">Hi {name}, just a reminder that your BookARide transfer is scheduled for <strong>{date} at {time}</strong>.</p>

    <div style="background:#f9f6ee;border:1.5px solid #D4AF37;border-radius:12px;padding:16px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        {_row("Ref", f"#{ref}")}
        {_row("Pickup", pickup)}
        {_row("Time", time)}
      </table>
    </div>

    <p style="color:#666;font-size:14px;margin:0 0 16px;">
      Your driver will contact you before arrival. If you need to make any changes, please call us as soon as possible.
    </p>
    <a href="tel:+6421880793" style="display:inline-block;background:#D4AF37;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">📞 021 880 793</a>
    """

    return await send_email(
        to=email,
        subject=f"Reminder: Your transfer tomorrow — #{ref}",
        html=_base_template(f"Transfer Tomorrow #{ref}", body),
    )
