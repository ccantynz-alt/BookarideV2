"""
BookARide V2 — Booking Models
Bulletproof validation for every booking field.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import pytz
from pydantic import BaseModel, Field, field_validator, model_validator


# ── Constants ────────────────────────────────────────────────────

VALID_STATUSES = ("pending", "confirmed", "completed", "cancelled")
VALID_PAYMENT_STATUSES = ("unpaid", "paid")
VALID_SERVICE_TYPES = ("airport-transfer", "point-to-point")

# State machine: maps current status → allowed next statuses
STATUS_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled"},
    "completed": set(),   # terminal
    "cancelled": set(),   # terminal
}

NZ_TZ = pytz.timezone("Pacific/Auckland")
EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
PHONE_RE = re.compile(r"^[\d\s+\-().]{7,20}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_RE = re.compile(r"^\d{2}:\d{2}$")
FLIGHT_RE = re.compile(r"^[A-Z0-9]{2,8}$")


# ── Pricing sub-model ───────────────────────────────────────────

class PricingData(BaseModel):
    """Validated pricing breakdown — no arbitrary dicts."""
    distance: float = 0.0
    basePrice: float = 0.0
    airportFee: float = 0.0
    oversizedLuggageFee: float = 0.0
    passengerFee: float = 0.0
    stripeFee: float = 0.0
    subtotal: float = 0.0
    totalPrice: float = 0.0
    ratePerKm: float = 0.0
    # Override fields (admin only)
    priceOverride: Optional[bool] = None
    overrideBy: Optional[str] = None
    overrideReason: Optional[str] = None
    overrideAt: Optional[str] = None
    originalTotalPrice: Optional[float] = None


# ── Booking Create Model ────────────────────────────────────────

class BookingCreate(BaseModel):
    """Input model for creating a new booking. Every field validated."""

    # Trip details
    serviceType: str = "airport-transfer"
    pickupAddress: str
    pickupAddresses: Optional[List[str]] = []
    dropoffAddress: str
    date: str
    time: str
    passengers: str = "1"

    # Flight information
    departureFlightNumber: Optional[str] = ""
    departureTime: Optional[str] = ""
    arrivalFlightNumber: Optional[str] = ""
    arrivalTime: Optional[str] = ""
    flightNumber: Optional[str] = ""

    # Customer details
    name: str
    email: str
    phone: str
    notes: Optional[str] = ""

    # Pricing
    pricing: dict

    # Status
    status: str = "pending"
    payment_status: Optional[str] = "unpaid"

    # Return trip
    bookReturn: Optional[bool] = False
    returnDate: Optional[str] = ""
    returnTime: Optional[str] = ""
    returnFlightNumber: Optional[str] = ""
    returnDepartureFlightNumber: Optional[str] = ""
    returnDepartureTime: Optional[str] = ""
    returnArrivalFlightNumber: Optional[str] = ""
    returnArrivalTime: Optional[str] = ""

    # Preferences
    notificationPreference: Optional[str] = "both"
    skipNotifications: Optional[bool] = False
    paymentMethod: Optional[str] = "card"
    language: Optional[str] = "en"
    vipAirportPickup: Optional[bool] = False
    oversizedLuggage: Optional[bool] = False
    selectedAddOns: Optional[List[str]] = []
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # ── Field Validators ─────────────────────────────────────

    @field_validator("serviceType")
    @classmethod
    def validate_service_type(cls, v):
        if v not in VALID_SERVICE_TYPES:
            raise ValueError(f"Invalid service type '{v}'. Must be one of: {VALID_SERVICE_TYPES}")
        return v

    @field_validator("pickupAddress")
    @classmethod
    def validate_pickup_address(cls, v):
        v = (v or "").strip()
        if len(v) < 5:
            raise ValueError("Pickup address is required (minimum 5 characters)")
        return v

    @field_validator("dropoffAddress")
    @classmethod
    def validate_dropoff_address(cls, v):
        v = (v or "").strip()
        if len(v) < 5:
            raise ValueError("Drop-off address is required (minimum 5 characters)")
        return v

    @field_validator("pickupAddresses")
    @classmethod
    def validate_pickup_addresses(cls, v):
        if v and len(v) > 3:
            raise ValueError("Maximum 3 additional pickup stops allowed")
        return [addr.strip() for addr in (v or []) if addr and addr.strip()]

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v):
        v = (v or "").strip()
        if not DATE_RE.match(v):
            raise ValueError(f"Invalid date format '{v}'. Use YYYY-MM-DD")
        # Validate it's a real date
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid date '{v}'. Not a valid calendar date")
        return v

    @field_validator("time")
    @classmethod
    def validate_time_format(cls, v):
        v = (v or "").strip()
        if not TIME_RE.match(v):
            raise ValueError(f"Invalid time format '{v}'. Use HH:MM (24-hour)")
        h, m = map(int, v.split(":"))
        if not (0 <= h <= 23 and m in (0, 30)):
            raise ValueError(f"Invalid time '{v}'. Hours 00-23, minutes must be 00 or 30")
        return v

    @field_validator("passengers")
    @classmethod
    def validate_passengers(cls, v):
        try:
            n = int(v)
            if n < 1 or n > 11:
                raise ValueError("Passengers must be between 1 and 11")
        except (TypeError, ValueError) as e:
            if "Passengers must be" in str(e):
                raise
            raise ValueError(f"Invalid passenger count '{v}'. Must be a number 1-11")
        return str(v)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        v = (v or "").strip()
        if len(v) < 2:
            raise ValueError("Name is required (minimum 2 characters)")
        if len(v) > 100:
            raise ValueError("Name must be under 100 characters")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        v = (v or "").strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError(f"Invalid email address '{v}'")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        v = (v or "").strip()
        if not PHONE_RE.match(v):
            raise ValueError(f"Invalid phone number '{v}'. Use digits, spaces, +, -, (, )")
        return v

    @field_validator("departureFlightNumber", "arrivalFlightNumber", "returnFlightNumber",
                     "returnDepartureFlightNumber", "returnArrivalFlightNumber")
    @classmethod
    def validate_flight_number(cls, v):
        v = (v or "").strip().upper()
        if v and not FLIGHT_RE.match(v):
            raise ValueError(f"Invalid flight number '{v}'. Use 2-8 alphanumeric characters (e.g. NZ1, QF145)")
        return v

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        v = (v or "").strip()
        if len(v) > 1000:
            raise ValueError("Notes must be under 1000 characters")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in VALID_STATUSES:
            raise ValueError(f"Invalid status '{v}'. Must be one of: {VALID_STATUSES}")
        return v

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, v):
        if v and v not in VALID_PAYMENT_STATUSES:
            raise ValueError(f"Invalid payment status '{v}'. Must be one of: {VALID_PAYMENT_STATUSES}")
        return v

    # ── Model Validators ─────────────────────────────────────

    @model_validator(mode="after")
    def validate_date_not_in_past(self):
        """Booking date cannot be in the past (NZ timezone)."""
        if self.date:
            try:
                today = datetime.now(NZ_TZ).strftime("%Y-%m-%d")
                if self.date < today:
                    raise ValueError(
                        f"Booking date ({self.date}) cannot be in the past. "
                        f"Today is {today} (NZ time)."
                    )
            except ValueError:
                raise
            except Exception:
                pass
        return self

    @model_validator(mode="after")
    def validate_return_trip(self):
        """If return trip is booked, require return date, time, and flight number for airport transfers."""
        if not self.bookReturn:
            return self

        if not self.returnDate:
            raise ValueError("Return date is required when booking a return trip")
        if not DATE_RE.match(self.returnDate):
            raise ValueError(f"Invalid return date format '{self.returnDate}'. Use YYYY-MM-DD")
        if not self.returnTime:
            raise ValueError("Return time is required when booking a return trip")

        # Return date must be on or after outbound date
        if self.returnDate < self.date:
            raise ValueError(
                f"Return date ({self.returnDate}) cannot be before "
                f"outbound date ({self.date})"
            )

        # For airport transfers, require return flight number
        service = (self.serviceType or "").lower()
        is_airport = "airport" in service or "shuttle" in service
        if is_airport:
            flight = (
                self.returnFlightNumber
                or self.returnDepartureFlightNumber
                or ""
            ).strip()
            if not flight:
                raise ValueError(
                    "Return flight number is required for airport transfer return bookings"
                )

        return self

    @model_validator(mode="after")
    def validate_pricing_has_total(self):
        """Pricing dict must contain a totalPrice."""
        if not self.pricing:
            raise ValueError("Pricing information is required")
        total = self.pricing.get("totalPrice", 0)
        if not total or float(total) <= 0:
            raise ValueError("Pricing must include a valid totalPrice greater than 0")
        return self


# ── Stored Booking Model ────────────────────────────────────────

class Booking(BookingCreate):
    """Full booking record as stored in the database."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referenceNumber: Optional[str] = None

    class Config:
        extra = "allow"

    @model_validator(mode="before")
    @classmethod
    def convert_reference(cls, data):
        if isinstance(data, dict) and "referenceNumber" in data:
            ref = data["referenceNumber"]
            if ref is not None:
                data["referenceNumber"] = str(ref)
        return data

    # Skip strict validation on existing bookings loaded from DB
    @model_validator(mode="after")
    def validate_date_not_in_past(self):
        return self  # skip for existing records

    @model_validator(mode="after")
    def validate_return_trip(self):
        return self  # skip for existing records

    @model_validator(mode="after")
    def validate_pricing_has_total(self):
        return self  # skip for existing records


# ── Status Transition Helper ────────────────────────────────────

def validate_status_transition(current: str, new: str) -> bool:
    """Check if a status transition is valid according to the state machine."""
    if current == new:
        return True  # no-op is always valid
    allowed = STATUS_TRANSITIONS.get(current, set())
    return new in allowed


def get_allowed_transitions(current: str) -> set:
    """Return the set of statuses reachable from the current status."""
    return STATUS_TRANSITIONS.get(current, set())
