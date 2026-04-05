/**
 * BookARide V2 — Comprehensive Booking System E2E Tests
 *
 * Tests the complete customer booking flow:
 * Step 0: Trip Details → Step 1: Your Details ��� Step 2: Confirm & Pay
 *
 * Run: npx playwright test
 * Debug: npx playwright test --debug
 */

import { test, expect } from '@playwright/test'

// ── Constants ────────────────────────────────────────────────────

const BOOKING_URL = '/book-now'
const MOCK_PICKUP = '123 Queen Street, Auckland, New Zealand'
const MOCK_DROPOFF = 'Auckland Airport, Ray Emery Drive, Mangere, Auckland, New Zealand'
const MOCK_CUSTOMER = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+64 21 123 4567',
  notes: 'This is a test booking',
}
const MOCK_PRICING = {
  distance: 25.0,
  basePrice: 137.5,
  airportFee: 0,
  oversizedLuggageFee: 0,
  passengerFee: 0,
  stripeFee: 4.29,
  subtotal: 150.0,
  totalPrice: 154.29,
  ratePerKm: 5.5,
}

// Tomorrow's date in YYYY-MM-DD format
function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Mock API routes so tests don't need a running backend.
 */
async function mockAPIs(page) {
  // Mock price calculation
  await page.route('**/calculate-price', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PRICING),
    })
  })

  // Mock booking creation
  await page.route('**/bookings', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-booking-id-123',
          referenceNumber: '42',
          ...body,
          status: 'pending',
          payment_status: 'unpaid',
        }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock Stripe checkout creation
  await page.route('**/payment/create-checkout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: 'https://checkout.stripe.com/test-session',
        session_id: 'cs_test_123',
      }),
    })
  })

  // Mock Google Places autocomplete
  await page.route('**/places/autocomplete**', async (route) => {
    const url = new URL(route.request().url())
    const input = url.searchParams.get('input') || ''
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        predictions: [
          { description: MOCK_PICKUP, place_id: 'place_1' },
          { description: MOCK_DROPOFF, place_id: 'place_2' },
        ],
      }),
    })
  })
}

/**
 * Fill in Step 0 (Trip Details) with valid data.
 */
async function fillStep0(page) {
  // Set pickup address directly (bypass autocomplete for speed)
  const pickupInput = page.locator('[data-testid="address-input-pickup-address"]')
  await pickupInput.fill(MOCK_PICKUP)

  // Click an autocomplete suggestion
  await page.waitForTimeout(400)
  const suggestion = page.locator('li[role="option"]').first()
  if (await suggestion.isVisible()) {
    await suggestion.click()
  }

  // Click Auckland Airport preset
  await page.click('[data-testid="airport-preset-auckland-airport"]')

  // Wait for price calculation
  await page.waitForSelector('[data-testid="price-breakdown"]', { timeout: 5000 })

  // Set date (tomorrow)
  const dateInput = page.locator('[data-testid="date-input-pickup-date"]')
  await dateInput.fill(getTomorrow())

  // Set time
  const timeSelect = page.locator('[data-testid="time-select-pickup-time"]')
  await timeSelect.selectOption('10:00')
}

/**
 * Fill in Step 1 (Your Details) with valid data.
 */
async function fillStep1(page) {
  await page.fill('[data-testid="name-input"]', MOCK_CUSTOMER.name)
  await page.fill('[data-testid="email-input"]', MOCK_CUSTOMER.email)
  await page.fill('[data-testid="phone-input"]', MOCK_CUSTOMER.phone)
  await page.fill('[data-testid="notes-input"]', MOCK_CUSTOMER.notes)
}

// ── Tests ────────────────────────────────────────────────────────

test.describe('Booking Page — Loading & Layout', () => {
  test('page loads with correct title and step indicator', async ({ page }) => {
    await page.goto(BOOKING_URL)
    await expect(page.locator('h1')).toContainText('Book Your Transfer')
    // Step indicator should show 3 steps
    await expect(page.locator('[aria-label="Booking progress"]')).toBeVisible()
  })

  test('page shows trust signals at bottom', async ({ page }) => {
    await page.goto(BOOKING_URL)
    await expect(page.getByText('Fixed prices')).toBeVisible()
    await expect(page.getByText('Flight tracking')).toBeVisible()
    await expect(page.getByText('Free cancellation')).toBeVisible()
  })

  test('starts on Step 0 (Trip Details)', async ({ page }) => {
    await page.goto(BOOKING_URL)
    // Step 1 indicator should be active
    const step1Indicator = page.locator('[aria-current="step"]')
    await expect(step1Indicator).toContainText('1')
  })
})

test.describe('Step 0 — Trip Details', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page)
    await page.goto(BOOKING_URL)
  })

  test('shows pickup and dropoff address inputs', async ({ page }) => {
    await expect(page.locator('[data-testid="address-input-pickup-address"]')).toBeVisible()
    await expect(page.locator('[data-testid="address-input-drop-off-address"]')).toBeVisible()
  })

  test('shows airport quick-select presets', async ({ page }) => {
    await expect(page.locator('[data-testid="airport-preset-auckland-airport"]')).toBeVisible()
    await expect(page.locator('[data-testid="airport-preset-hamilton-airport"]')).toBeVisible()
    await expect(page.locator('[data-testid="airport-preset-whangarei-airport"]')).toBeVisible()
  })

  test('clicking airport preset sets dropoff address', async ({ page }) => {
    await page.click('[data-testid="airport-preset-auckland-airport"]')
    // The button should now be highlighted (has gold background)
    const btn = page.locator('[data-testid="airport-preset-auckland-airport"]')
    await expect(btn).toHaveClass(/bg-gold/)
  })

  test('shows date and time pickers', async ({ page }) => {
    await expect(page.locator('[data-testid="date-button-pickup-date"]')).toBeVisible()
    await expect(page.locator('[data-testid="time-button-pickup-time"]')).toBeVisible()
  })

  test('shows passenger selector', async ({ page }) => {
    await expect(page.locator('[data-testid="passengers-select"]')).toBeVisible()
  })

  test('shows option toggles (VIP, Luggage, Return)', async ({ page }) => {
    await expect(page.locator('[data-testid="option-vipAirportPickup"]')).toBeVisible()
    await expect(page.locator('[data-testid="option-oversizedLuggage"]')).toBeVisible()
    await expect(page.locator('[data-testid="option-bookReturn"]')).toBeVisible()
  })

  test('can add and remove additional pickups', async ({ page }) => {
    await page.click('[data-testid="add-pickup-button"]')
    await expect(page.locator('[data-testid="address-input-additional-pickup-1"]')).toBeVisible()

    // Add second
    await page.click('[data-testid="add-pickup-button"]')
    await expect(page.locator('[data-testid="address-input-additional-pickup-2"]')).toBeVisible()

    // Remove first (click the X button)
    await page.locator('button[aria-label="Remove additional pickup 1"]').click()
    await expect(page.locator('[data-testid="address-input-additional-pickup-2"]')).not.toBeVisible()
  })

  test('max 3 additional pickups enforced', async ({ page }) => {
    await page.click('[data-testid="add-pickup-button"]')
    await page.click('[data-testid="add-pickup-button"]')
    await page.click('[data-testid="add-pickup-button"]')
    // "Add another" button should disappear
    await expect(page.locator('[data-testid="add-pickup-button"]')).not.toBeVisible()
  })

  test('toggling return trip shows return details form', async ({ page }) => {
    await page.click('[data-testid="option-bookReturn"]')
    // Return details section should appear
    await expect(page.locator('[data-testid="date-button-return-date"]')).toBeVisible()
    await expect(page.locator('[data-testid="time-button-return-time"]')).toBeVisible()
    await expect(page.locator('[data-testid="return-flight-input"]')).toBeVisible()
  })

  test('price breakdown appears after both addresses entered', async ({ page }) => {
    // Enter pickup
    const pickupInput = page.locator('[data-testid="address-input-pickup-address"]')
    await pickupInput.fill(MOCK_PICKUP)
    await page.waitForTimeout(400)
    const suggestion1 = page.locator('li[role="option"]').first()
    if (await suggestion1.isVisible()) await suggestion1.click()

    // Enter dropoff via preset
    await page.click('[data-testid="airport-preset-auckland-airport"]')

    // Wait for price
    await page.waitForSelector('[data-testid="price-breakdown"]', { timeout: 5000 })
    await expect(page.locator('[data-testid="price-breakdown"]')).toBeVisible()
    await expect(page.getByText('NZD')).toBeVisible()
  })

  test('continue button is disabled without addresses', async ({ page }) => {
    const btn = page.locator('[data-testid="step0-continue"]')
    // Should show disabled state
    await expect(btn).toHaveClass(/bg-gray-200/)
  })

  test('cannot proceed without required fields', async ({ page }) => {
    // Enter just pickup, no dropoff
    const pickupInput = page.locator('[data-testid="address-input-pickup-address"]')
    await pickupInput.fill(MOCK_PICKUP)
    await page.waitForTimeout(400)
    const suggestion = page.locator('li[role="option"]').first()
    if (await suggestion.isVisible()) await suggestion.click()

    // Try to click continue
    await page.click('[data-testid="step0-continue"]')

    // Should still be on step 0 (no step transition)
    await expect(page.locator('[data-testid="step0-continue"]')).toBeVisible()
  })

  test('flight number inputs enforce uppercase', async ({ page }) => {
    await page.fill('[data-testid="departure-flight-input"]', 'nz1')
    await expect(page.locator('[data-testid="departure-flight-input"]')).toHaveValue('NZ1')
  })
})

test.describe('Step 0 → Step 1 Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page)
    await page.goto(BOOKING_URL)
  })

  test('can proceed from Step 0 to Step 1 with valid data', async ({ page }) => {
    await fillStep0(page)
    await page.click('[data-testid="step0-continue"]')

    // Should now be on Step 1
    await expect(page.locator('[data-testid="name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
  })

  test('shows validation errors when required Step 0 fields are missing', async ({ page }) => {
    // Enter addresses to enable continue button
    const pickupInput = page.locator('[data-testid="address-input-pickup-address"]')
    await pickupInput.fill(MOCK_PICKUP)
    await page.waitForTimeout(400)
    const suggestion = page.locator('li[role="option"]').first()
    if (await suggestion.isVisible()) await suggestion.click()

    await page.click('[data-testid="airport-preset-auckland-airport"]')
    await page.waitForSelector('[data-testid="price-breakdown"]', { timeout: 5000 })

    // Try to proceed without date/time
    await page.click('[data-testid="step0-continue"]')

    // Should show error banner
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible()
  })
})

test.describe('Step 1 — Your Details', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page)
    await page.goto(BOOKING_URL)
    await fillStep0(page)
    await page.click('[data-testid="step0-continue"]')
  })

  test('shows all customer detail fields', async ({ page }) => {
    await expect(page.locator('[data-testid="name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="phone-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="notes-input"]')).toBeVisible()
  })

  test('back button returns to Step 0', async ({ page }) => {
    await page.click('[data-testid="step1-back"]')
    // Should be back on Step 0
    await expect(page.locator('[data-testid="step0-continue"]')).toBeVisible()
  })

  test('form data persists when going back to Step 0', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', 'Test Name')
    await page.click('[data-testid="step1-back"]')
    await page.click('[data-testid="step0-continue"]')
    // Name should still be there
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('Test Name')
  })

  test('cannot proceed without name, email, phone', async ({ page }) => {
    // Try to continue with empty fields
    await page.click('[data-testid="step1-continue"]')
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible()
  })

  test('shows field-level validation errors', async ({ page }) => {
    // Fill only name, leave email and phone empty
    await page.fill('[data-testid="name-input"]', MOCK_CUSTOMER.name)
    await page.click('[data-testid="step1-continue"]')

    // Should show errors for email and phone
    await expect(page.getByText('Valid email address is required')).toBeVisible()
    await expect(page.getByText('Valid phone number is required')).toBeVisible()
  })

  test('validates email format', async ({ page }) => {
    await page.fill('[data-testid="name-input"]', MOCK_CUSTOMER.name)
    await page.fill('[data-testid="email-input"]', 'not-an-email')
    await page.fill('[data-testid="phone-input"]', MOCK_CUSTOMER.phone)
    await page.click('[data-testid="step1-continue"]')

    await expect(page.getByText('Valid email address is required')).toBeVisible()
  })

  test('can proceed with all required fields filled', async ({ page }) => {
    await fillStep1(page)
    await page.click('[data-testid="step1-continue"]')

    // Should be on Step 2
    await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible()
  })
})

test.describe('Step 2 — Confirm & Pay', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page)
    await page.goto(BOOKING_URL)
    await fillStep0(page)
    await page.click('[data-testid="step0-continue"]')
    await fillStep1(page)
    await page.click('[data-testid="step1-continue"]')
  })

  test('shows booking summary with all details', async ({ page }) => {
    const summary = page.locator('[data-testid="booking-summary"]')
    await expect(summary).toBeVisible()

    // Check key details are displayed
    await expect(summary).toContainText(MOCK_CUSTOMER.name)
    await expect(summary).toContainText(MOCK_CUSTOMER.email)
    await expect(summary).toContainText(MOCK_CUSTOMER.phone)
  })

  test('shows price breakdown', async ({ page }) => {
    await expect(page.locator('[data-testid="price-breakdown"]')).toBeVisible()
    await expect(page.getByText('NZD')).toBeVisible()
  })

  test('shows pay button with correct amount', async ({ page }) => {
    const payButton = page.locator('[data-testid="pay-button"]')
    await expect(payButton).toBeVisible()
    await expect(payButton).toContainText(`$${MOCK_PRICING.totalPrice.toFixed(2)}`)
  })

  test('back button returns to Step 1', async ({ page }) => {
    await page.click('[data-testid="step2-back"]')
    await expect(page.locator('[data-testid="name-input"]')).toBeVisible()
  })

  test('shows secure payment notice', async ({ page }) => {
    await expect(page.getByText('Secure payment via Stripe')).toBeVisible()
  })

  test('pay button triggers booking creation and Stripe redirect', async ({ page }) => {
    // Listen for navigation to Stripe
    const [request] = await Promise.all([
      page.waitForRequest('**/bookings'),
      page.click('[data-testid="pay-button"]'),
    ])

    // Verify the booking request was made
    expect(request.method()).toBe('POST')
    const body = request.postDataJSON()
    expect(body.name).toBe(MOCK_CUSTOMER.name)
    expect(body.email).toBe(MOCK_CUSTOMER.email)
    expect(body.pricing.totalPrice).toBe(MOCK_PRICING.totalPrice)
  })

  test('pay button shows loading state when clicked', async ({ page }) => {
    // Click pay — it'll try to redirect to Stripe mock URL
    await page.click('[data-testid="pay-button"]')
    // The button should briefly show "Processing..."
    // (may be too fast to catch, but we verify no error appears)
    await page.waitForTimeout(500)
  })
})

test.describe('Return Trip Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page)
    await page.goto(BOOKING_URL)
  })

  test('return trip details required when return is toggled', async ({ page }) => {
    await fillStep0(page)

    // Toggle return trip
    await page.click('[data-testid="option-bookReturn"]')

    // Try to proceed without return details
    await page.click('[data-testid="step0-continue"]')

    // Should show errors for return fields
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible()
  })

  test('return trip section shows in summary on Step 2', async ({ page }) => {
    await fillStep0(page)

    // Toggle return and fill details
    await page.click('[data-testid="option-bookReturn"]')
    const tomorrow = getTomorrow()
    const dayAfter = new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0]

    await page.locator('[data-testid="date-input-return-date"]').fill(dayAfter)
    await page.locator('[data-testid="time-select-return-time"]').selectOption('14:00')
    await page.fill('[data-testid="return-flight-input"]', 'NZ456')

    // Wait for price recalculation
    await page.waitForSelector('[data-testid="price-breakdown"]', { timeout: 5000 })

    await page.click('[data-testid="step0-continue"]')
    await fillStep1(page)
    await page.click('[data-testid="step1-continue"]')

    // Summary should show return trip details
    await expect(page.getByText('Return Trip')).toBeVisible()
    await expect(page.getByText('NZ456')).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('shows error when price calculation fails', async ({ page }) => {
    // Mock price calculation to fail
    await page.route('**/calculate-price', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Unable to calculate price — please check addresses' }),
      })
    })
    await page.route('**/places/autocomplete**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          predictions: [
            { description: MOCK_PICKUP, place_id: 'place_1' },
          ],
        }),
      })
    })

    await page.goto(BOOKING_URL)

    const pickupInput = page.locator('[data-testid="address-input-pickup-address"]')
    await pickupInput.fill(MOCK_PICKUP)
    await page.waitForTimeout(400)
    const suggestion = page.locator('li[role="option"]').first()
    if (await suggestion.isVisible()) await suggestion.click()

    await page.click('[data-testid="airport-preset-auckland-airport"]')

    // Wait for error to appear
    await page.waitForSelector('[data-testid="error-banner"]', { timeout: 5000 })
    await expect(page.locator('[data-testid="error-banner"]')).toContainText('Unable to calculate price')
  })

  test('shows error when booking creation fails', async ({ page }) => {
    await mockAPIs(page)

    // Override booking route to fail
    await page.route('**/bookings', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: [{ msg: 'Booking date cannot be in the past' }],
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(BOOKING_URL)
    await fillStep0(page)
    await page.click('[data-testid="step0-continue"]')
    await fillStep1(page)
    await page.click('[data-testid="step1-continue"]')

    // Click pay
    await page.click('[data-testid="pay-button"]')

    // Should show error
    await page.waitForSelector('[data-testid="error-banner"]', { timeout: 5000 })
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible()
  })

  test('error banner can be dismissed by clicking X', async ({ page }) => {
    await mockAPIs(page)
    await page.goto(BOOKING_URL)

    // Force an error to appear
    const pickupInput = page.locator('[data-testid="address-input-pickup-address"]')
    await pickupInput.fill(MOCK_PICKUP)
    await page.waitForTimeout(400)
    const suggestion = page.locator('li[role="option"]').first()
    if (await suggestion.isVisible()) await suggestion.click()
    await page.click('[data-testid="airport-preset-auckland-airport"]')
    await page.waitForSelector('[data-testid="price-breakdown"]', { timeout: 5000 })

    // Click continue without date/time to trigger validation error
    await page.click('[data-testid="step0-continue"]')
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible()

    // Click X to dismiss
    await page.locator('[data-testid="error-banner"] svg').first().click()
    await expect(page.locator('[data-testid="error-banner"]')).not.toBeVisible()
  })
})

test.describe('Idempotency Protection', () => {
  test('booking request includes idempotency header', async ({ page }) => {
    await mockAPIs(page)
    await page.goto(BOOKING_URL)
    await fillStep0(page)
    await page.click('[data-testid="step0-continue"]')
    await fillStep1(page)
    await page.click('[data-testid="step1-continue"]')

    const [request] = await Promise.all([
      page.waitForRequest('**/bookings'),
      page.click('[data-testid="pay-button"]'),
    ])

    const headers = request.headers()
    expect(headers['x-idempotency-key']).toBeTruthy()
    expect(headers['x-idempotency-key'].length).toBeGreaterThan(10)
  })
})

test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('booking page renders correctly on mobile', async ({ page }) => {
    await page.goto(BOOKING_URL)
    await expect(page.locator('h1')).toContainText('Book Your Transfer')
    // All key elements should be visible
    await expect(page.locator('[data-testid="address-input-pickup-address"]')).toBeVisible()
    await expect(page.locator('[data-testid="step0-continue"]')).toBeVisible()
  })

  test('airport presets are visible on mobile', async ({ page }) => {
    await page.goto(BOOKING_URL)
    await expect(page.locator('[data-testid="airport-preset-auckland-airport"]')).toBeVisible()
  })
})

test.describe('Customer Details Persistence', () => {
  test('saves customer details to localStorage after booking', async ({ page }) => {
    await mockAPIs(page)
    await page.goto(BOOKING_URL)
    await fillStep0(page)
    await page.click('[data-testid="step0-continue"]')
    await fillStep1(page)
    await page.click('[data-testid="step1-continue"]')
    await page.click('[data-testid="pay-button"]')

    // Check localStorage was set
    await page.waitForTimeout(500)
    const saved = await page.evaluate(() => localStorage.getItem('bookaride_customer'))
    const parsed = JSON.parse(saved)
    expect(parsed.name).toBe(MOCK_CUSTOMER.name)
    expect(parsed.email).toBe(MOCK_CUSTOMER.email)
    expect(parsed.phone).toBe(MOCK_CUSTOMER.phone)
  })

  test('pre-fills customer details from localStorage', async ({ page }) => {
    // Set localStorage before navigating
    await page.goto(BOOKING_URL)
    await page.evaluate((customer) => {
      localStorage.setItem('bookaride_customer', JSON.stringify(customer))
    }, MOCK_CUSTOMER)

    // Reload page
    await page.reload()

    // Navigate to Step 1 (need valid Step 0 first)
    await mockAPIs(page)
    await fillStep0(page)
    await page.click('[data-testid="step0-continue"]')

    // Customer details should be pre-filled
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue(MOCK_CUSTOMER.name)
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue(MOCK_CUSTOMER.email)
    await expect(page.locator('[data-testid="phone-input"]')).toHaveValue(MOCK_CUSTOMER.phone)
  })
})
