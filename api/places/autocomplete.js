// Vercel serverless function — proxies to Google Places API (New)
// Keeps the API key server-side. Called by the frontend AddressInput component.
export default async function handler(req, res) {
  // CORS headers for the Vercel preview / production domain
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { input, sessiontoken } = req.query

  if (!input || input.length < 2) {
    return res.status(200).json({ predictions: [] })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key not configured' })
  }

  try {
    const body = {
      input,
      includedRegionCodes: ['nz'],
      languageCode: 'en',
    }
    if (sessiontoken) body.sessionToken = sessiontoken

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'suggestions.placePrediction.text,suggestions.placePrediction.placeId',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Google Places API error:', err)
      return res.status(response.status).json({ error: 'Places API error', predictions: [] })
    }

    const data = await response.json()
    const predictions = (data.suggestions || []).map((s) => ({
      description: s?.placePrediction?.text?.text || '',
      place_id: s?.placePrediction?.placeId || '',
    }))

    return res.status(200).json({ predictions })
  } catch (err) {
    console.error('Places autocomplete error:', err)
    return res.status(500).json({ error: 'Internal error', predictions: [] })
  }
}
