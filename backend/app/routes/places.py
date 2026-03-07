import logging
import httpx
from fastapi import APIRouter, HTTPException

from app.core.config import settings

router = APIRouter(prefix="/places", tags=["Places"])
logger = logging.getLogger(__name__)


@router.get("/autocomplete")
async def autocomplete(input: str, sessiontoken: str = ""):
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        logger.error("GOOGLE_MAPS_API_KEY is not set")
        raise HTTPException(status_code=500, detail="Google Maps API key not configured")

    body = {
        "input": input,
        "includedRegionCodes": ["nz"],
        "languageCode": "en",
    }
    if sessiontoken:
        body["sessionToken"] = sessiontoken

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://places.googleapis.com/v1/places:autocomplete",
                json=body,
                headers={
                    "X-Goog-Api-Key": api_key,
                    "X-Goog-FieldMask": "suggestions.placePrediction.text,suggestions.placePrediction.placeId",
                },
                timeout=5.0,
            )
    except httpx.RequestError as e:
        logger.error(f"Places API request failed: {e}")
        raise HTTPException(status_code=502, detail="Could not reach Google Places API")

    if resp.status_code != 200:
        logger.error(f"Places API returned {resp.status_code}: {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail="Places API error")

    data = resp.json()
    suggestions = data.get("suggestions", [])
    return {
        "predictions": [
            {
                "description": s.get("placePrediction", {}).get("text", {}).get("text", ""),
                "place_id": s.get("placePrediction", {}).get("placeId", ""),
            }
            for s in suggestions
        ]
    }


@router.get("/test")
async def test_places():
    """Quick check: is the API key configured and does it work?"""
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        return {"configured": False, "error": "GOOGLE_MAPS_API_KEY not set"}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://places.googleapis.com/v1/places:autocomplete",
                json={"input": "Auckland Airport", "includedRegionCodes": ["nz"]},
                headers={
                    "X-Goog-Api-Key": api_key,
                    "X-Goog-FieldMask": "suggestions.placePrediction.text",
                },
                timeout=5.0,
            )
        if resp.status_code == 200:
            return {"configured": True, "status": "working"}
        else:
            return {"configured": True, "status": "error", "code": resp.status_code, "detail": resp.text}
    except Exception as e:
        return {"configured": True, "status": "error", "detail": str(e)}
