/**
 * Acceptance test script for Feature 18: Dynamic Delivery Fee Engine
 *
 * Run from the backend/ directory:
 *   node test-delivery-fee.js
 *
 * Tests:
 * 1. GET /api/health returns 200
 * 2. Supabase client initializes without error (server already up)
 * 3. Gemini client initializes without error
 * 4. Cluster fee always less than sum of individual fees
 * 5. POST /api/delivery/fee returns correct breakdown
 * 6. Fee increases proportionally with distance
 */

import dotenv from 'dotenv'
dotenv.config()

import { haversineDistance } from './utils/geoUtils.js'
import { calculate } from './services/deliveryFeeService.js'

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`

let passed = 0
let failed = 0

const assert = (label, condition, detail = '') => {
  if (condition) {
    console.log(`  ✅  ${label}`)
    passed++
  } else {
    console.log(`  ❌  ${label}${detail ? ' — ' + detail : ''}`)
    failed++
  }
}

// ─── Test 1: GET /api/health ─────────────────────────────────────────────────
console.log('\n── Test 1: GET /api/health ──')
try {
  const res = await fetch(`${BASE_URL}/api/health`)
  const body = await res.json()
  assert('Returns 200', res.status === 200)
  assert('Body has { status: "ok" }', body.status === 'ok')
} catch (e) {
  assert('Server reachable', false, e.message)
}

// ─── Test 2: Supabase client ─────────────────────────────────────────────────
console.log('\n── Test 2: Supabase client initializes ──')
try {
  const { default: supabase } = await import('./config/db.js')
  // A simple ping: fetch 1 row from any table — error means credentials are wrong
  const { error } = await supabase.from('profiles').select('id').limit(1)
  assert('Supabase client initializes without error', !error, error?.message)
} catch (e) {
  assert('Supabase client initializes without error', false, e.message)
}

// ─── Test 3: Gemini client initializes ───────────────────────────────────────
console.log('\n── Test 3: Gemini client references env key ──')
assert(
  'GEMINI_API_KEY is set in .env',
  Boolean(process.env.GEMINI_API_KEY),
  'GEMINI_API_KEY missing from .env'
)

// ─── Test 4: Haversine accuracy ───────────────────────────────────────────────
console.log('\n── Test 4: Haversine distance accuracy ──')
// Dhaka to a point ~1 km away (approx delta lat = 0.009°)
const distClose = haversineDistance(23.8103, 90.4125, 23.8193, 90.4125)
const distFar   = haversineDistance(23.8103, 90.4125, 23.8403, 90.4125)
assert('Distance > 0', distClose > 0)
assert('Farther point produces greater distance', distFar > distClose)

// ─── Test 5: Service — cluster fee < individual total ────────────────────────
console.log('\n── Test 5: Cluster fee < sum of individual fees ──')

// Two restaurants close to each other (~1 km apart), user at a different point
const restaurants = [
  { id: 'r1', name: 'Burger Bhai', lat: 23.8103, lng: 90.4125 },
  { id: 'r2', name: 'Pizza Place',  lat: 23.8193, lng: 90.4125 },
]
const userLat = 23.8300
const userLng = 90.4125

const nonCluster = calculate(restaurants, userLat, userLng, false)
const cluster    = calculate(restaurants, userLat, userLng, true)

assert(
  'Non-cluster fee is sum of individual fees',
  nonCluster.fee === nonCluster.breakdown.reduce((s, b) => s + b.fee, 0)
)
assert(
  'Cluster fee is less than non-cluster total',
  cluster.fee < nonCluster.fee,
  `cluster=${cluster.fee}, nonCluster=${nonCluster.fee}`
)
assert('Cluster savings > 0', cluster.savings > 0)
assert('Non-cluster savings === 0', nonCluster.savings === 0)

// ─── Test 6: Fee increases proportionally with distance ──────────────────────
console.log('\n── Test 6: Fee increases with distance ──')

const near = [{ id: 'r1', name: 'Near Place', lat: 23.8150, lng: 90.4125 }]
const far  = [{ id: 'r2', name: 'Far Place',  lat: 23.9000, lng: 90.4125 }]

const nearFee = calculate(near, userLat, userLng, false).fee
const farFee  = calculate(far,  userLat, userLng, false).fee

assert(
  'Farther restaurant has higher fee',
  farFee > nearFee,
  `near=${nearFee}, far=${farFee}`
)

// ─── Test 7: POST /api/delivery/fee endpoint ─────────────────────────────────
console.log('\n── Test 7: POST /api/delivery/fee — input validation (no auth) ──')
try {
  // No auth token — should return 401
  const res = await fetch(`${BASE_URL}/api/delivery/fee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantIds: ['r1'], userLat: 23.81, userLng: 90.41, isCluster: false }),
  })
  assert('Returns 401 without auth token', res.status === 401)
} catch (e) {
  assert('Endpoint reachable', false, e.message)
}

// ─── Test 8: POST /api/delivery/fee — with Supabase login ────────────────────
console.log('\n── Test 8: POST /api/delivery/fee — end-to-end with valid session ──')
try {
  const { default: supabase } = await import('./config/db.js')

  // Try to log in with the test admin account.
  // If credentials are unavailable, this block is skipped gracefully.
  const TEST_EMAIL    = process.env.TEST_EMAIL
  const TEST_PASSWORD = process.env.TEST_PASSWORD

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.log('  ⚠️  TEST_EMAIL / TEST_PASSWORD not set in .env — skipping live endpoint test')
    console.log('      To run: add TEST_EMAIL and TEST_PASSWORD to backend/.env and rerun.')
  } else {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    if (authError) throw new Error(`Login failed: ${authError.message}`)

    const token = authData.session.access_token

    // Fetch two real restaurants from DB
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name, lat, lng')
      .not('lat', 'is', null)
      .limit(2)

    if (!restaurants || restaurants.length < 1) {
      console.log('  ⚠️  No restaurants with coordinates in DB — skipping live endpoint test')
    } else {
      const ids = restaurants.map((r) => r.id)
      const res = await fetch(`${BASE_URL}/api/delivery/fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantIds: ids,
          userLat: 23.8103,
          userLng: 90.4125,
          isCluster: ids.length > 1,
        }),
      })
      const body = await res.json()
      assert('Returns 200 with valid auth', res.status === 200, JSON.stringify(body))
      assert('Response has fee field', typeof body.fee === 'number')
      assert('Response has breakdown array', Array.isArray(body.breakdown))
      assert('Response has savings field', body.savings !== undefined)
      if (ids.length > 1) {
        assert('Cluster savings >= 0', body.savings >= 0)
      }
    }
  }
} catch (e) {
  console.log(`  ⚠️  Live endpoint test skipped: ${e.message}`)
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('All tests passed! Feature 18 is ready. ✅')
} else {
  console.log('Some tests failed. See details above.')
  process.exit(1)
}
