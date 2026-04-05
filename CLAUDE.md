# CLAUDE.md — BookARide V2 System Reference

> **READ THIS ENTIRE FILE BEFORE MAKING ANY CHANGES.**
> This is the single source of truth for the BookARide V2 codebase.
> Every Claude session MUST read this file first. No exceptions.

---

## Project Overview

**BookARide V2** is a premium airport transfer booking platform for Auckland, New Zealand.
Customers book private car transfers to/from airports. The system handles pricing, payments,
email/SMS notifications, and admin management.

**Live URL:** https://bookaride.co.nz
**Business Phone:** 021 880 793
**Business Email:** info@bookaride.co.nz

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite 6 | SPA with React Router v7 |
| Styling | Tailwind CSS 3.4 | Gold brand color `#D4AF37` |
| Animations | Framer Motion 12 | Page transitions, micro-interactions |
| Icons | Lucide React | Consistent icon set |
| HTTP Client | Axios | With auth interceptor |
| Backend | FastAPI (Python 3.11) | Async throughout |
| Database | Neon PostgreSQL | JSONB document storage |
| DB Layer | Custom MongoDB-compat | `/backend/app/core/database.py` |
| Payments | Stripe | NZD, checkout sessions |
| Email | Mailgun | HTML templates |
| SMS | Twilio | Booking confirmations + reminders |
| Address | Google Places API | Autocomplete via backend proxy |
| Distance | Geoapify Routing API | Route distance calculation |
| Scheduler | APScheduler | 24h reminder emails |
| Auth | JWT (HS256) | 24h expiry, admin only |
| Deploy (FE) | Vercel | Auto-deploy from main |
| Deploy (BE) | Render | Python 3.11, port 10000 |
| Testing | Playwright | E2E booking flow tests |

---

## Project Structure

```
BookarideV2/
├── CLAUDE.md                  # THIS FILE — read first every session
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── playwright.config.js   # E2E test config
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx            # Route definitions
│   │   ├── main.jsx           # React entry point
│   │   ├── index.css          # Tailwind imports
│   │   ├── lib/
│   │   │   ├── api.js         # Axios instance + interceptors
│   │   │   └── cn.js          # clsx + tailwind-merge utility
│   │   ├── hooks/
│   │   │   └── useBookingForm.js  # Booking form state management
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Layout.jsx # Header + Footer wrapper
│   │   │   ├── pages/
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── BookNow.jsx        # MAIN BOOKING PAGE
│   │   │   │   ├── PaymentSuccess.jsx
│   │   │   │   ├── Services.jsx
│   │   │   │   ├── About.jsx
│   │   │   │   ├── Contact.jsx
│   │   │   │   ├── Terms.jsx
│   │   │   │   ├── Privacy.jsx
│   │   │   │   ├── NotFound.jsx
│   │   │   │   └── admin/
│   │   │   │       ├── AdminLogin.jsx
│   │   │   │       └── AdminDashboard.jsx
│   │   │   ├── booking/           # BOOKING COMPONENTS
│   │   │   │   ├── AddressInput.jsx
│   │   │   │   ├── DateTimePicker.jsx
│   │   │   │   ├── PriceBreakdown.jsx
│   │   │   │   ├── BookingSummary.jsx
│   │   │   │   └── StepIndicator.jsx
│   │   │   └── admin/
│   │   │       ├── AdminCreateBooking.jsx
│   │   │       ├── AdminBookings.jsx
│   │   │       ├── AdminEmail.jsx
│   │   │       └── AdminLivePricing.jsx
│   │   └── tests/
│   │       └── booking.spec.js    # Playwright E2E tests
│   └── dist/                      # Build output (gitignored)
├── backend/
│   ├── requirements.txt
│   ├── start.py                   # Uvicorn launcher
│   ├── schema.sql                 # PostgreSQL schema
│   └── app/
│       ├── main.py                # FastAPI app + startup
│       ├── core/
│       │   ├── config.py          # Environment settings
│       │   ├── database.py        # Neon PostgreSQL + MongoDB compat
│       │   └── auth.py            # JWT auth
│       ├── models/
│       │   └── booking.py         # Pydantic booking models
│       ├── routes/
│       │   ├── bookings.py        # Booking CRUD endpoints
│       │   ├── pricing.py         # Price calculation engine
│       │   ├── payments.py        # Stripe integration
│       │   ├── admin.py           # Admin endpoints
│       │   ├── auth.py            # Login/register
│       │   ├── places.py          # Google Places proxy
│       │   └── drivers.py         # Driver management
│       └── services/
│           ├── email.py           # Mailgun email templates
│           └── sms.py             # Twilio SMS
├── api/                           # Geolocation utilities
├── scripts/                       # Migration/utility scripts
├── render.yaml                    # Render deployment config
└── vercel.json                    # Vercel deployment config
```

---

## Booking System Architecture

### Booking Flow (Customer)

```
1. Customer visits /book-now
2. Step 1: TRIP DETAILS
   - Enter pickup address (Google Places autocomplete)
   - Optional: add up to 3 additional pickup stops
   - Enter drop-off address (quick-select airport presets available)
   - Select date and time
   - Select passenger count (1-11)
   - Optional: flight numbers (departure/arrival)
   - Optional: VIP Airport Pickup (+$15), Oversized Luggage (+$25)
   - Optional: Return trip (doubles price, requires return date/time/flight)
   → Price auto-calculates when both addresses are filled (600ms debounce)

3. Step 2: YOUR DETAILS
   - Full name, email, phone
   - Special requests (optional)
   - Customer details saved to localStorage for returning visitors

4. Step 3: REVIEW & PAY
   - Full booking summary displayed
   - Price breakdown shown
   - "Pay $X.XX NZD" button → creates booking → creates Stripe checkout → redirect

5. Stripe checkout page (hosted by Stripe)
   - Customer pays with card

6. /payment-success page
   - Booking confirmed, reference number shown
   - Confirmation email sent to customer
   - Operator notified via email + SMS
```

### Booking States (State Machine)

```
VALID TRANSITIONS:
  pending    → confirmed  (payment received OR admin confirms)
  pending    → cancelled  (admin cancels)
  confirmed  → completed  (admin marks complete after trip)
  confirmed  → cancelled  (admin cancels)

INVALID TRANSITIONS (enforced):
  completed  → anything   (terminal state)
  cancelled  → anything   (terminal state)
  confirmed  → pending    (no going backwards)
```

### Pricing Engine

**Endpoint:** `POST /calculate-price`

**Distance-based tiered pricing:**
| Distance | Rate |
|----------|------|
| ≤ 15 km | $12.00/km |
| 15-15.8 km | $8.00/km |
| 15.8-16 km | $6.00/km |
| 16-25.5 km | $5.50/km |
| 25.5-35 km | $5.00/km |
| 35-50 km | $4.00/km |
| 50-60 km | $2.60/km |
| 60-75 km | $2.47/km |
| 75-100 km | $2.70/km |
| > 100 km | $3.50/km |

**Additional fees:**
- VIP Airport Pickup: +$15
- Oversized Luggage: +$25
- Extra passengers: +$5 per person (after first)
- Stripe processing: 2.9% + $0.30
- **Minimum per leg: $150**

**Return trip:** 2x single-leg price

**Zone minimums** (prevents under-pricing known routes):
- Hibiscus Coast ↔ Airport: min 73 km
- North Auckland ↔ Airport: min 65 km
- Hamilton ↔ Airport: min 125 km
- Whangarei ↔ Airport: min 182 km
- Tauranga ↔ Airport: min 200 km

### Payment Flow

```
1. POST /bookings          → Creates booking (status: pending, payment: unpaid)
2. POST /payment/create-checkout → Creates Stripe checkout session
3. Customer redirected to Stripe checkout
4. Stripe webhook fires    → POST /payment/webhook/stripe
5. Webhook handler:
   - Updates booking: status=confirmed, payment_status=paid
   - Sends confirmation email to customer
   - Sends notification to operator
   - Sends SMS confirmations
```

---

## API Endpoints Reference

### Public Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /bookings | Create new booking |
| POST | /calculate-price | Get instant price quote |
| POST | /payment/create-checkout | Create Stripe checkout |
| GET | /payment/success | Fetch booking after payment |
| POST | /payment/webhook/stripe | Stripe webhook handler |
| GET | /places/autocomplete | Google Places proxy |

### Admin Endpoints (require JWT)

| Method | Path | Purpose |
|--------|------|---------|
| GET | /bookings | List all bookings |
| GET | /bookings/count | Booking statistics |
| PATCH | /bookings/{id} | Update booking fields |
| DELETE | /bookings/{id} | Soft-delete booking |
| POST | /admin/bookings/create | Create booking for customer |
| POST | /admin/bookings/{id}/confirm | Confirm pending booking |
| POST | /admin/bookings/{id}/cancel | Cancel booking |
| PATCH | /admin/bookings/{id}/price-override | Override price |
| POST | /payment/send-payment-link/{id} | Email payment link |
| GET | /admin/dashboard | Quick stats |
| GET | /admin/customers | Customer list |
| POST | /admin/live-pricing | Price calculator (no booking) |
| POST | /admin/email/test | Send test email |
| GET | /admin/email/logs | Email history |

### Auth Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /admin/login | Admin login → JWT |
| POST | /admin/register | Register admin (first only) |

---

## Database Schema

All tables use the same pattern:
```sql
CREATE TABLE IF NOT EXISTS table_name (
    _id        BIGSERIAL PRIMARY KEY,
    id         TEXT UNIQUE NOT NULL,
    data       JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

The `data` column stores the full document. Frequently queried fields have extracted indexes.

**Key tables:** bookings, deleted_bookings, payment_transactions, admin_users, counters, email_logs

The MongoDB compatibility layer in `/backend/app/core/database.py` translates MongoDB-style
queries ($set, $in, $or, etc.) to PostgreSQL JSONB operations. **Do NOT modify database.py**
unless you fully understand the translation layer.

---

## Branding & Design

- **Primary color:** Gold `#D4AF37` (Tailwind: `gold`, `gold-50` through `gold-900`)
- **Font:** Inter (Google Fonts)
- **Dark backgrounds:** gray-900, gray-950 (admin dashboard)
- **Light backgrounds:** white, gray-50 (public pages)
- **Border radius:** rounded-xl (12px) for cards, rounded-lg (8px) for inputs
- **Shadows:** shadow-sm for cards, shadow-md on hover
- **Animations:** Framer Motion for step transitions, hover effects

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=            # Neon PostgreSQL connection string
JWT_SECRET_KEY=          # HS256 signing key
STRIPE_SECRET_KEY=       # Stripe secret key (sk_...)
STRIPE_WEBHOOK_SECRET=   # Stripe webhook signing secret (whsec_...)
MAILGUN_API_KEY=         # Mailgun API key
MAILGUN_DOMAIN=          # bookaride.co.nz
TWILIO_ACCOUNT_SID=      # Twilio account SID
TWILIO_AUTH_TOKEN=       # Twilio auth token
TWILIO_PHONE_NUMBER=     # Twilio phone number
GOOGLE_MAPS_API_KEY=     # Google Maps/Places API key
GEOAPIFY_API_KEY=        # Geoapify routing API key
PUBLIC_DOMAIN=           # https://bookaride.co.nz
PORT=10000               # Backend port
```

### Frontend (.env)
```
VITE_API_URL=            # API base URL (default: /api)
```

---

## Development Commands

```bash
# Frontend
cd frontend
npm install
npm run dev          # Dev server on :3000 (proxies /api to :10000)
npm run build        # Production build → dist/
npx playwright test  # Run E2E tests

# Backend
cd backend
pip install -r requirements.txt
python start.py      # Uvicorn on :10000
```

---

## Critical Rules for AI Sessions

1. **READ THIS FILE FIRST** — every session, no exceptions
2. **Do NOT modify `/backend/app/core/database.py`** — the MongoDB compat layer is complex and working
3. **Do NOT modify `/backend/schema.sql`** unless adding NEW tables — existing tables have production data
4. **Do NOT change the pricing tiers** without explicit owner approval — these are business-critical rates
5. **Do NOT change Stripe integration flow** — it's working in production with real payments
6. **Do NOT remove email templates** — customers receive these, they must stay professional
7. **All dates use `Pacific/Auckland` timezone** — this is NZ business, never use UTC for display
8. **Currency is always NZD** — New Zealand Dollars
9. **Minimum booking price is $150 per leg** — business rule, do not remove
10. **The booking state machine is enforced** — no skipping states (pending → confirmed → completed)
11. **Always test the build** before committing: `cd frontend && npm run build`
12. **Never push to main directly** — always use feature branches
13. **Keep the gold branding** — `#D4AF37` is the brand color throughout

---

## Known Integrations & External Services

| Service | Status | Notes |
|---------|--------|-------|
| Stripe | LIVE | Real payments, NZD |
| Mailgun | LIVE | bookaride.co.nz domain |
| Twilio | LIVE | NZ phone numbers |
| Google Places | LIVE | Autocomplete for NZ addresses |
| Geoapify | LIVE | Route distance calculation |
| Neon PostgreSQL | LIVE | Production database |
| Vercel | LIVE | Frontend hosting |
| Render | LIVE | Backend hosting |

---

## Booking Data Model

```python
{
    "id": "uuid-v4",
    "referenceNumber": "10",          # Sequential, auto-incremented
    "serviceType": "airport-transfer",
    "pickupAddress": "123 Queen St, Auckland",
    "pickupAddresses": [],            # Additional stops (max 3)
    "dropoffAddress": "Auckland Airport, Ray Emery Drive...",
    "date": "2025-06-15",            # YYYY-MM-DD
    "time": "14:30",                 # 24-hour format HH:MM
    "passengers": "2",
    "departureFlightNumber": "NZ1",
    "arrivalFlightNumber": "",
    "bookReturn": false,
    "returnDate": "",
    "returnTime": "",
    "returnFlightNumber": "",
    "vipAirportPickup": false,
    "oversizedLuggage": false,
    "selectedAddOns": [],
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+6421234567",
    "notes": "",
    "pricing": {
        "distance": 45.2,
        "basePrice": 180.80,
        "airportFee": 0,
        "oversizedLuggageFee": 0,
        "passengerFee": 5.0,
        "stripeFee": 5.69,
        "subtotal": 185.80,
        "totalPrice": 191.49,
        "ratePerKm": 4.0
    },
    "totalPrice": 191.49,
    "status": "pending",              # pending | confirmed | completed | cancelled
    "payment_status": "unpaid",       # unpaid | paid
    "createdAt": "2025-06-10T02:30:00Z",
    "notificationPreference": "both",
    "paymentMethod": "card",
    "language": "en"
}
```

---

## Testing Strategy

### Playwright E2E Tests (`/frontend/tests/booking.spec.js`)

Tests cover the complete booking flow:
1. Page loads correctly with all form elements
2. Step 1 validation (required fields)
3. Address input autocomplete interaction
4. Date/time picker functionality
5. Price calculation triggers and displays
6. Step navigation (forward/back)
7. Step 2 validation (customer details)
8. Step 3 review summary accuracy
9. Form state persistence across steps
10. Error handling (API failures, network errors)
11. Mobile responsive layout
12. Return trip toggle and validation

### Running Tests
```bash
cd frontend
npx playwright install    # First time only
npx playwright test       # Run all tests
npx playwright test --ui  # Interactive UI mode
```

---

## Deployment

### Frontend (Vercel)
- Auto-deploys on push to `main`
- Build: `cd frontend && npm install && npm run build`
- Output: `frontend/dist`
- API proxy: `/api/*` → Render backend
- SPA fallback: all routes → `index.html`

### Backend (Render)
- Auto-deploys on push to `main`
- Build: `pip install -r requirements.txt`
- Start: `python start.py`
- Health check: `/healthz`
- Port: 10000

---

## Changelog

### 2026-04-05 — Complete Booking System Rebuild
- Rebuilt entire booking system from scratch
- New multi-step wizard with proper validation per step
- Added booking state machine (enforced transitions)
- Added idempotency protection (prevents double-booking)
- Added useBookingForm custom hook for clean state management
- Added StepIndicator and BookingSummary components
- Enhanced AddressInput, DateTimePicker, PriceBreakdown components
- Added comprehensive Playwright E2E tests
- Created this CLAUDE.md as the definitive project reference
