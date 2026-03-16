// frontend/src/components/user/NearbyRestaurantsView.jsx
//
// Renders dummy restaurants around the user's picked location.
// Restaurants are split into two visually distinct sections:
//   🔗 Cluster Delivery  — close enough for one-rider combined pickup
//   🚚 Standard Delivery — too far apart, ordered individually
//
// All math is client-side (no backend needed) because restaurants are demo data.
// When real DB restaurant coordinates exist, the cart calls /api/cluster/check
// instead — this component is purely for demonstrating the clustering concept.

import { useMemo } from 'react'

// ─── Math helpers ─────────────────────────────────────────────────────────────

const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const allPairsWithinRadius = (restaurants, radiusKm = 2) => {
  for (let i = 0; i < restaurants.length; i++) {
    for (let j = i + 1; j < restaurants.length; j++) {
      if (haversine(restaurants[i].lat, restaurants[i].lng, restaurants[j].lat, restaurants[j].lng) > radiusKm) return false
    }
  }
  return true
}

// Mirror the backend deliveryFeeService formula
const estimateFee = (restaurants, userLat, userLng, isCluster) => {
  const BASE = 20, PER_KM = 10, DISCOUNT = 0.6
  const distances = restaurants.map(r => haversine(userLat, userLng, r.lat, r.lng))
  const normalTotal = distances.reduce((s, d) => s + BASE + d * PER_KM, 0)
  if (!isCluster) return { fee: normalTotal, savings: 0 }
  const maxDist = Math.max(...distances)
  const clusterFee = (BASE + maxDist * PER_KM) * DISCOUNT
  return { fee: clusterFee, savings: normalTotal - clusterFee }
}

// ─── Dummy restaurant templates ───────────────────────────────────────────────
// Offsets are verified:
//   Group A (3 restaurants): all within ~0.42km of each other  → CLUSTER ✓
//   Group B (2 restaurants): within ~0.30km of each other      → CLUSTER ✓
//   A and B are 2.1km apart                                    → stay separate ✓
//   Standalones are 4.5–5.7km from clusters                    → standard only ✓

const TEMPLATES = [
  // ── Cluster A — tight group ~1.1–1.4km NE of user ─────────────────────────
  { id: 'demo-a1', name: 'Burger Bhai',   emoji: '🍔', category: 'Burger & Fast Food',  avgRating: 4.5, avgPrepTime: 20, dlat:  0.0070, dlng: 0.0080, group: 'A', tagline: 'Smash burgers & loaded fries' },
  { id: 'demo-a2', name: 'Pizza Point',   emoji: '🍕', category: 'Pizza & Italian',     avgRating: 4.2, avgPrepTime: 25, dlat:  0.0090, dlng: 0.0060, group: 'A', tagline: 'Wood-fired pizza, fresh ingredients' },
  { id: 'demo-a3', name: 'Noodle House',  emoji: '🍜', category: 'Chinese & Noodles',   avgRating: 4.7, avgPrepTime: 15, dlat:  0.0080, dlng: 0.0100, group: 'A', tagline: 'Ramen, pad thai, dim sum' },
  // ── Cluster B — pair ~1–1.3km SW of user ──────────────────────────────────
  { id: 'demo-b1', name: 'Rice Bowl',     emoji: '🍚', category: 'Rice & Biryani',      avgRating: 4.0, avgPrepTime: 18, dlat: -0.0070, dlng: -0.0060, group: 'B', tagline: 'Biryani, fried rice, pilaf' },
  { id: 'demo-b2', name: 'Curry Corner',  emoji: '🍛', category: 'Indian & Curry',      avgRating: 4.3, avgPrepTime: 22, dlat: -0.0090, dlng: -0.0080, group: 'B', tagline: 'Rich curries, naan, daal' },
  // ── Standalones — 4.5–5.7km away, cannot cluster ──────────────────────────
  { id: 'demo-s1', name: 'Spice Garden',  emoji: '🌶️', category: 'Indian & Spicy',      avgRating: 4.1, avgPrepTime: 30, dlat:  0.0400, dlng: 0.0250, group: null, tagline: 'Bold spices, tandoor grill' },
  { id: 'demo-s2', name: 'Sweet Tooth',   emoji: '🍰', category: 'Desserts & Drinks',   avgRating: 4.8, avgPrepTime: 10, dlat: -0.0320, dlng: -0.0280, group: null, tagline: 'Cakes, waffles, milkshakes' },
  { id: 'demo-s3', name: 'Grill Station', emoji: '🥩', category: 'Grill & BBQ',          avgRating: 4.4, avgPrepTime: 28, dlat:  0.0250, dlng: -0.0380, group: null, tagline: 'Seekh kebab, mixed grill' },
]

const generateRestaurants = (userLat, userLng) =>
  TEMPLATES.map((t) => ({
    ...t,
    lat: userLat + t.dlat,
    lng: userLng + t.dlng,
    distanceKm: parseFloat(haversine(userLat, userLng, userLat + t.dlat, userLng + t.dlng).toFixed(2)),
  }))

// ─── Sub-components ───────────────────────────────────────────────────────────

const RestaurantRow = ({ r, isInCluster }) => (
  <div className={`rounded-xl border p-3 flex items-center gap-3 ${isInCluster ? 'bg-white border-emerald-200' : 'bg-white border-gray-200'}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${isInCluster ? 'bg-emerald-50' : 'bg-gray-50'}`}>
      {r.emoji}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-bold text-gray-900 text-sm">{r.name}</span>
        <span className="text-xs text-gray-400 truncate">— {r.tagline}</span>
      </div>
      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
        <span>⭐ {r.avgRating}</span>
        <span className="text-gray-300">·</span>
        <span>📍 {r.distanceKm} km away</span>
        <span className="text-gray-300">·</span>
        <span>⏱ {r.avgPrepTime} min prep</span>
      </div>
    </div>
  </div>
)

const ClusterGroup = ({ groupId, restaurants, userLat, userLng }) => {
  const clusterFeeInfo = estimateFee(restaurants, userLat, userLng, true)
  const normalFeeInfo  = estimateFee(restaurants, userLat, userLng, false)

  let maxIntraKm = 0
  for (let i = 0; i < restaurants.length; i++)
    for (let j = i + 1; j < restaurants.length; j++) {
      const d = haversine(restaurants[i].lat, restaurants[i].lng, restaurants[j].lat, restaurants[j].lng)
      if (d > maxIntraKm) maxIntraKm = d
    }

  return (
    <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔗</span>
            <span className="font-black text-emerald-800 text-sm">
              Cluster {groupId} — {restaurants.length} Restaurants
            </span>
          </div>
          <p className="text-xs text-emerald-600 mt-0.5">
            All within <strong>{(maxIntraKm * 1000).toFixed(0)} m</strong> of each other — one rider collects everything
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-200 rounded-full px-2.5 py-1">CLUSTER</span>
      </div>

      {/* Restaurant list */}
      <div className="space-y-2 mb-3">
        {restaurants.map((r) => <RestaurantRow key={r.id} r={r} isInCluster />)}
      </div>

      {/* Fee savings */}
      <div className="rounded-xl bg-white/70 border border-emerald-200 px-3 py-2.5 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Combined delivery fee</span>
          <span className="font-black text-emerald-700">৳{clusterFeeInfo.fee.toFixed(0)}</span>
        </div>
        {clusterFeeInfo.savings > 0 && (
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-400">Individual total: <span className="line-through">৳{normalFeeInfo.fee.toFixed(0)}</span></span>
            <span className="text-emerald-600 font-semibold">You save ৳{clusterFeeInfo.savings.toFixed(0)} 🎉</span>
          </div>
        )}
      </div>

      {/* Placeholder CTA */}
      <button disabled title="Order placement coming in Sprint 3"
        className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold opacity-60 cursor-not-allowed">
        🔗 Order as Cluster &nbsp;<span className="text-xs font-normal opacity-80">(Sprint 3)</span>
      </button>
    </div>
  )
}

const StandaloneCard = ({ r, userLat, userLng }) => {
  const { fee } = estimateFee([r], userLat, userLng, false)
  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-2xl shrink-0">{r.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900 text-sm">{r.name}</span>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">Standard</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{r.tagline}</p>
          <div className="flex gap-2 mt-1 text-xs text-gray-500">
            <span>⭐ {r.avgRating}</span>
            <span className="text-gray-300">·</span>
            <span>📍 {r.distanceKm} km</span>
            <span className="text-gray-300">·</span>
            <span>⏱ {r.avgPrepTime} min</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mb-3 px-0.5">
        <span>Delivery fee</span>
        <span className="font-semibold text-gray-700">৳{fee.toFixed(0)}</span>
      </div>
      <button disabled title="Order placement coming in Sprint 3"
        className="w-full py-2 rounded-xl bg-gray-200 text-gray-500 text-sm font-bold cursor-not-allowed">
        📦 Order Normally &nbsp;<span className="text-xs font-normal opacity-70">(Sprint 3)</span>
      </button>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

const NearbyRestaurantsView = ({ userLocation }) => {
  const { lat, lng } = userLocation

  const { clusters, standalone } = useMemo(() => {
    const all = generateRestaurants(lat, lng)
    const byGroup = all.reduce((acc, r) => {
      if (!r.group) return acc
      if (!acc[r.group]) acc[r.group] = []
      acc[r.group].push(r)
      return acc
    }, {})
    const validClusters = Object.entries(byGroup).filter(([, rs]) => allPairsWithinRadius(rs, 2))
    return { clusters: validClusters, standalone: all.filter((r) => !r.group) }
  }, [lat, lng])

  const clusterCount  = clusters.reduce((s, [, rs]) => s + rs.length, 0)

  return (
    <div className="space-y-6">

      {/* Summary bar */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-bold text-gray-900 text-sm">{clusterCount + standalone.length} restaurants near your location</p>
          <p className="text-xs text-gray-500 mt-0.5">{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">🔗 {clusterCount} clusterable</span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">🚚 {standalone.length} standard</span>
        </div>
      </div>

      {/* SECTION 1 — Cluster Delivery */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-6 rounded-full bg-emerald-500" />
          <h2 className="font-black text-gray-900 text-base">🔗 Cluster Delivery Available</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4 ml-4">
          These restaurants are close to each other. One rider picks up everything — you save on delivery.
        </p>
        {clusters.length === 0 ? (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-6 text-center text-gray-400 text-sm">
            No clusters near this location.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clusters.map(([groupId, restaurants]) => (
              <ClusterGroup key={groupId} groupId={groupId} restaurants={restaurants} userLat={lat} userLng={lng} />
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-4 text-xs text-gray-400 font-medium uppercase tracking-widest">Standard Delivery Only</span>
        </div>
      </div>

      {/* SECTION 2 — Standard Delivery */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-6 rounded-full bg-gray-400" />
          <h2 className="font-black text-gray-900 text-base">🚚 Standard Delivery</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4 ml-4">
          Too far apart for combined delivery. Each restaurant is ordered and delivered separately.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {standalone.map((r) => <StandaloneCard key={r.id} r={r} userLat={lat} userLng={lng} />)}
        </div>
      </section>

      {/* How it works */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-4">
        <p className="text-xs font-bold text-blue-800 mb-1">ℹ️ How clustering works</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          The system uses the <strong>Haversine formula</strong> to measure real GPS distance between restaurants.
          If ALL restaurants in a group are within <strong>2 km</strong> of each other, they qualify for cluster delivery —
          one rider picks up all orders in a single trip, splitting the travel cost.
        </p>
      </div>

    </div>
  )
}

export default NearbyRestaurantsView