import logging
import os
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(tags=["Pricing"])
logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

DEFAULT_FALLBACK_KM = 75.0
LONG_DISTANCE_FALLBACK_KM = 200.0


class PriceRequest(BaseModel):
    serviceType: str
    pickupAddress: str
    pickupAddresses: Optional[List[str]] = []
    dropoffAddress: str
    passengers: int
    vipAirportPickup: bool = False
    oversizedLuggage: bool = False
    bookReturn: bool = False


class PriceBreakdown(BaseModel):
    distance: float
    basePrice: float
    airportFee: float
    oversizedLuggageFee: float
    passengerFee: float
    stripeFee: float
    subtotal: float
    totalPrice: float
    ratePerKm: float


def _norm(s: str) -> str:
    return (s or "").lower().replace("\u0101", "a").replace("\u0101", "a")


def _get_rate(km: float) -> float:
    """Tiered $/km rate based on distance bracket."""
    if km <= 15.0:
        return 12.00
    elif km <= 15.8:
        return 8.00
    elif km <= 16.0:
        return 6.00
    elif km <= 25.5:
        return 5.50
    elif km <= 35.0:
        return 5.00
    elif km <= 50.0:
        return 4.00
    elif km <= 60.0:
        return 2.60
    elif km <= 75.0:
        return 2.47
    elif km <= 100.0:
        return 2.70
    else:
        return 3.50


async def _get_distance_geoapify(
    pickup: str, dropoff: str, waypoints: list, api_key: str
) -> Optional[float]:
    """Get route distance via Geoapify Routing API."""
    try:

        async def geocode(address: str):
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.geoapify.com/v1/geocode/search",
                    params={"text": address, "limit": 1, "apiKey": api_key},
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    features = resp.json().get("features", [])
                    if features:
                        coords = features[0]["geometry"]["coordinates"]
                        return coords  # [lng, lat]
            return None

        origin = await geocode(pickup)
        dest = await geocode(dropoff)
        if not origin or not dest:
            return None

        wp_coords = []
        for wp in waypoints:
            c = await geocode(wp)
            if c:
                wp_coords.append(c)

        all_points = [origin] + wp_coords + [dest]
        waypoint_str = "|".join(f"{c[1]},{c[0]}" for c in all_points)

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.geoapify.com/v1/routing",
                params={
                    "waypoints": waypoint_str,
                    "mode": "drive",
                    "apiKey": api_key,
                },
                timeout=10.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                if features:
                    distance_m = features[0]["properties"]["distance"]
                    return round(distance_m / 1000, 1)
        return None
    except Exception as e:
        logger.warning(f"Geoapify error: {e}")
        return None


# Zone minimum distances
ZONE_MINIMUMS = {
    "hibiscus_airport": 73.0,
    "north_auckland_airport": 65.0,
    "hamilton_airport": 125.0,
    "whangarei_airport": 182.0,
    "tauranga_airport": 200.0,
}

AIRPORT_KW = ["airport", "auckland airport", "international airport", "domestic airport", "akl", "mangere"]
HIBISCUS_KW = ["orewa", "whangaparaoa", "silverdale", "red beach", "stanmore bay", "army bay", "gulf harbour", "manly", "hibiscus coast", "millwater", "milldale"]
NORTH_AKL_KW = ["warkworth", "snells beach", "matakana", "leigh", "wellsford", "puhoi"]
HAMILTON_KW = ["hamilton", "frankton", "hillcrest", "rototuna", "cambridge", "te awamutu", "ngaruawahia"]
WHANGAREI_KW = ["whangarei", "onerahi", "kensington", "tikipunga"]
TAURANGA_KW = ["tauranga", "mount maunganui", "papamoa", "otumoetai", "bay of plenty", "katikati"]
LONG_DISTANCE_KW = TAURANGA_KW + HAMILTON_KW + WHANGAREI_KW + ["cambridge", "te awamutu"]


def _apply_zone_minimums(pickup: str, dropoff: str, distance_km: float) -> float:
    """Enforce minimum distances for known zone pairs."""
    p, d = _norm(pickup), _norm(dropoff)
    to_airport = any(kw in d for kw in AIRPORT_KW)
    from_airport = any(kw in p for kw in AIRPORT_KW)

    checks = [
        (HIBISCUS_KW, ZONE_MINIMUMS["hibiscus_airport"]),
        (NORTH_AKL_KW, ZONE_MINIMUMS["north_auckland_airport"]),
        (HAMILTON_KW, ZONE_MINIMUMS["hamilton_airport"]),
        (WHANGAREI_KW, ZONE_MINIMUMS["whangarei_airport"]),
        (TAURANGA_KW, ZONE_MINIMUMS["tauranga_airport"]),
    ]

    for kw_list, min_km in checks:
        from_zone = any(kw in p for kw in kw_list)
        to_zone = any(kw in d for kw in kw_list)
        if (from_zone and to_airport) or (to_zone and from_airport):
            if distance_km < min_km:
                logger.info(f"Zone min applied: {distance_km}km -> {min_km}km")
                distance_km = min_km
            break

    return distance_km


@router.post("/calculate-price", response_model=PriceBreakdown)
@limiter.limit("30/minute")
async def calculate_price(http_request: Request, request: PriceRequest):
    try:
        geoapify_key = os.environ.get("GEOAPIFY_API_KEY", "")
        distance_km = None

        p_lower = _norm(request.pickupAddress)
        d_lower = _norm(request.dropoffAddress)
        is_long = any(kw in p_lower or kw in d_lower for kw in LONG_DISTANCE_KW)
        fallback = LONG_DISTANCE_FALLBACK_KM if is_long else DEFAULT_FALLBACK_KM

        # Get distance via Geoapify
        if geoapify_key:
            waypoints = [a for a in (request.pickupAddresses or []) if a and a.strip()]
            distance_km = await _get_distance_geoapify(
                request.pickupAddress, request.dropoffAddress, waypoints, geoapify_key
            )

        if distance_km is None:
            pickup_count = 1 + len([a for a in (request.pickupAddresses or []) if a])
            distance_km = fallback * pickup_count

        # Apply zone minimums
        distance_km = _apply_zone_minimums(
            request.pickupAddress, request.dropoffAddress, distance_km
        )

        # Tiered pricing
        rate_per_km = _get_rate(distance_km)
        base_price = distance_km * rate_per_km

        # Add-ons
        airport_fee = 15.0 if request.vipAirportPickup else 0.0
        oversized_fee = 25.0 if request.oversizedLuggage else 0.0
        passenger_fee = max(0, request.passengers - 1) * 5.0

        total_price = base_price + airport_fee + oversized_fee + passenger_fee

        # Minimum $150 per leg
        if total_price < 150.0:
            total_price = 150.0

        one_way = round(total_price, 2)

        # Return trip = 2 legs
        if request.bookReturn:
            subtotal = round(2 * max(one_way, 150.0), 2)
            distance_km *= 2
            base_price *= 2
            airport_fee *= 2
            oversized_fee *= 2
            passenger_fee *= 2
        else:
            subtotal = one_way

        # Stripe fee (2.9% + $0.30)
        stripe_fee = round((subtotal * 0.029) + 0.30, 2)
        total_with_stripe = round(subtotal + stripe_fee, 2)

        return PriceBreakdown(
            distance=distance_km,
            basePrice=round(base_price, 2),
            airportFee=round(airport_fee, 2),
            oversizedLuggageFee=round(oversized_fee, 2),
            passengerFee=round(passenger_fee, 2),
            stripeFee=stripe_fee,
            subtotal=subtotal,
            totalPrice=total_with_stripe,
            ratePerKm=round(rate_per_km, 2),
        )
    except Exception as e:
        logger.error(f"Price calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
