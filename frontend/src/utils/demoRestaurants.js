// frontend/src/utils/demoRestaurants.js
//
// Single source of truth for all demo restaurant data and shared math.
// Imported by both LocationPickerMap (for map markers) and
// NearbyRestaurantsView (for the order/cart UI).
//
// Nothing here talks to the backend or any global state.

// ─── Core math ────────────────────────────────────────────────────────────────

export const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Returns true only if every pair of restaurants is ≤ radiusKm apart.
// This mirrors backend clusteringService.evaluateCluster exactly.
export const allPairsWithinRadius = (restaurants, radiusKm = 2) => {
  for (let i = 0; i < restaurants.length; i++) {
    for (let j = i + 1; j < restaurants.length; j++) {
      if (haversine(
        restaurants[i].lat, restaurants[i].lng,
        restaurants[j].lat, restaurants[j].lng
      ) > radiusKm) return false
    }
  }
  return true
}

// ─── Restaurant templates ─────────────────────────────────────────────────────
//
// dlat / dlng are degree offsets from the user's chosen location.
//
// Verified distances:
//   Cluster A (A1–A3): all pairs ≤ 0.52 km  → valid cluster ✓
//   Cluster B (B1–B2): pair = 0.30 km        → valid cluster ✓
//   A ↔ B minimum:     2.01 km               → do NOT merge  ✓
//   Standalone min dist from any cluster: 3.5 km             ✓

export const RESTAURANT_TEMPLATES = [
  // ── Cluster A — NE of user ────────────────────────────────────────────────
  { id: 'demo-a1', name: 'Burger Bhai',  emoji: '🍔', tagline: 'Smash burgers & loaded fries',   avgRating: 4.5, avgPrepTime: 20, dlat:  0.0070, dlng:  0.0080, group: 'A', clusterColor: '#059669' },
  { id: 'demo-a2', name: 'Pizza Point',  emoji: '🍕', tagline: 'Wood-fired pizza, fresh dough',  avgRating: 4.2, avgPrepTime: 25, dlat:  0.0085, dlng:  0.0055, group: 'A', clusterColor: '#059669' },
  { id: 'demo-a3', name: 'Noodle House', emoji: '🍜', tagline: 'Ramen, pad thai, dim sum',       avgRating: 4.7, avgPrepTime: 15, dlat:  0.0075, dlng:  0.0105, group: 'A', clusterColor: '#059669' },

  // ── Cluster B — SW of user ────────────────────────────────────────────────
  { id: 'demo-b1', name: 'Rice Bowl',    emoji: '🍚', tagline: 'Biryani, fried rice, pulao',     avgRating: 4.0, avgPrepTime: 18, dlat: -0.0065, dlng: -0.0055, group: 'B', clusterColor: '#7c3aed' },
  { id: 'demo-b2', name: 'Curry Corner', emoji: '🍛', tagline: 'Dal makhani, korma, naan',       avgRating: 4.3, avgPrepTime: 22, dlat: -0.0085, dlng: -0.0075, group: 'B', clusterColor: '#7c3aed' },

  // ── Standalone — too far to cluster ──────────────────────────────────────
  { id: 'demo-s1', name: 'Spice Garden',  emoji: '🌶️', tagline: 'Seekh kebab, tandoor grill',   avgRating: 4.1, avgPrepTime: 30, dlat:  0.0420, dlng:  0.0260, group: null, clusterColor: null },
  { id: 'demo-s2', name: 'Sweet Tooth',   emoji: '🍰',  tagline: 'Cakes, waffles, milkshakes',   avgRating: 4.8, avgPrepTime: 10, dlat: -0.0330, dlng: -0.0290, group: null, clusterColor: null },
  { id: 'demo-s3', name: 'Grill Station', emoji: '🥩',  tagline: 'Mixed grill, BBQ platters',    avgRating: 4.4, avgPrepTime: 28, dlat:  0.0260, dlng: -0.0390, group: null, clusterColor: null },
]

// ─── Generate live restaurant objects from templates + a user position ────────
// Returns a new array every time — safe to call in useMemo.
export const generateRestaurants = (userLat, userLng) =>
  RESTAURANT_TEMPLATES.map((t) => {
    const lat = userLat + t.dlat
    const lng = userLng + t.dlng
    return {
      ...t,
      lat,
      lng,
      distanceKm: parseFloat(haversine(userLat, userLng, lat, lng).toFixed(2)),
    }
  })

// ─── Dummy menus ──────────────────────────────────────────────────────────────
export const MENUS = {
  'demo-a1': [
    { id: 'a1-1', name: 'Smash Burger',          price: 180 },
    { id: 'a1-2', name: 'Double Cheese Burger',   price: 240 },
    { id: 'a1-3', name: 'Crispy Chicken Burger',  price: 200 },
    { id: 'a1-4', name: 'Loaded Fries',           price: 90  },
  ],
  'demo-a2': [
    { id: 'a2-1', name: 'Margherita Pizza',  price: 220 },
    { id: 'a2-2', name: 'BBQ Chicken Pizza', price: 300 },
    { id: 'a2-3', name: 'Pepperoni Feast',   price: 320 },
    { id: 'a2-4', name: 'Garlic Bread',      price: 80  },
  ],
  'demo-a3': [
    { id: 'a3-1', name: 'Beef Ramen',        price: 250 },
    { id: 'a3-2', name: 'Spicy Miso Ramen',  price: 230 },
    { id: 'a3-3', name: 'Pad Thai',          price: 190 },
    { id: 'a3-4', name: 'Veg Fried Rice',    price: 140 },
  ],
  'demo-b1': [
    { id: 'b1-1', name: 'Chicken Biryani',  price: 210 },
    { id: 'b1-2', name: 'Beef Kacchi',      price: 280 },
    { id: 'b1-3', name: 'Mutton Polao',     price: 260 },
    { id: 'b1-4', name: 'Plain Rice',       price: 60  },
  ],
  'demo-b2': [
    { id: 'b2-1', name: 'Dal Makhani',   price: 130 },
    { id: 'b2-2', name: 'Chicken Korma', price: 220 },
    { id: 'b2-3', name: 'Mutton Curry',  price: 280 },
    { id: 'b2-4', name: 'Garlic Naan',   price: 60  },
  ],
  'demo-s1': [
    { id: 's1-1', name: 'Seekh Kebab Platter', price: 240 },
    { id: 's1-2', name: 'Chicken Tikka',       price: 200 },
    { id: 's1-3', name: 'Tandoori Roti',       price: 50  },
  ],
  'demo-s2': [
    { id: 's2-1', name: 'Chocolate Lava Cake',   price: 150 },
    { id: 's2-2', name: 'Oreo Milkshake',        price: 110 },
    { id: 's2-3', name: 'Strawberry Waffles',    price: 180 },
    { id: 's2-4', name: 'Nutella Banana Crepe',  price: 130 },
  ],
  'demo-s3': [
    { id: 's3-1', name: 'Mixed Grill Platter', price: 350 },
    { id: 's3-2', name: 'BBQ Chicken Wings',   price: 200 },
    { id: 's3-3', name: 'Grilled Fish',        price: 280 },
  ],
}

// ─── Cluster colour map (group ID → hex) ─────────────────────────────────────
export const CLUSTER_COLORS = {
  A: '#059669', // emerald-600
  B: '#7c3aed', // violet-600
}