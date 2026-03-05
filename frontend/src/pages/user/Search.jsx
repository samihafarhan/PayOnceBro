import { useState, useEffect, useCallback } from 'react'
import SearchBar from '../../components/user/SearchBar'
import FoodCard from '../../components/user/FoodCard'
import { searchFood, getCategories as fetchApiCategories } from '../../services/searchService'

// ─────────────────────────────────────────────────────────────────────────────
// 🍔 DUMMY DATA — fake restaurants + food items for demo purposes
// This data lives right here in the file, no database needed!
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_RESTAURANTS = {
  r1: { id: 'r1', name: 'Burger Barn',    address: '12 Main Street, Dhaka',  lat: 23.8103, lng: 90.4125, avgRating: 4.5, avgPrepTime: 20 },
  r2: { id: 'r2', name: 'Pizza Palace',   address: '34 Ring Road, Dhaka',    lat: 23.8121, lng: 90.4140, avgRating: 4.2, avgPrepTime: 25 },
  r3: { id: 'r3', name: 'Noodle Nirvana', address: '56 Lake View, Dhaka',    lat: 23.8110, lng: 90.4132, avgRating: 4.7, avgPrepTime: 15 },
  r4: { id: 'r4', name: 'Spice Garden',   address: '78 Green Road, Dhaka',   lat: 23.8500, lng: 90.4300, avgRating: 4.0, avgPrepTime: 30 },
  r5: { id: 'r5', name: 'Sweet Tooth',    address: '90 Gulshan Ave, Dhaka',  lat: 23.8600, lng: 90.4150, avgRating: 4.8, avgPrepTime: 10 },
}

const DUMMY_ITEMS = [
  // ── Burger Barn (r1) ──────────────────────────────────────────────────────
  { id: 'm1',  restaurantId: 'r1', name: 'Classic Beef Burger',   description: 'Juicy beef patty, cheddar, lettuce, tomato and our secret sauce.',              price: 180, category: 'burger',  aiTags: ['halal'] },
  { id: 'm2',  restaurantId: 'r1', name: 'Double Smash Burger',   description: 'Two smashed beef patties, double cheese, pickles, caramelised onions.',          price: 260, category: 'burger',  aiTags: ['halal', 'high-protein'] },
  { id: 'm3',  restaurantId: 'r1', name: 'Crispy Chicken Burger', description: 'Fried crispy chicken thigh, coleslaw, sriracha mayo.',                           price: 200, category: 'burger',  aiTags: ['halal', 'spicy'] },
  { id: 'm4',  restaurantId: 'r1', name: 'Veggie Burger',         description: 'Black bean patty, avocado, roasted peppers, vegan mayo.',                        price: 160, category: 'burger',  aiTags: ['vegan', 'vegetarian'] },
  { id: 'm5',  restaurantId: 'r1', name: 'Loaded Fries',          description: 'Crispy fries topped with cheese sauce, jalapeños and pulled chicken.',           price: 120, category: 'sides',   aiTags: ['spicy'] },

  // ── Pizza Palace (r2) ─────────────────────────────────────────────────────
  { id: 'm6',  restaurantId: 'r2', name: 'Margherita Pizza',      description: 'Classic tomato base, fresh mozzarella, basil. Simple and perfect.',              price: 220, category: 'pizza',   aiTags: ['vegetarian'] },
  { id: 'm7',  restaurantId: 'r2', name: 'BBQ Chicken Pizza',     description: 'BBQ sauce base, grilled chicken strips, red onion, smoked cheddar.',             price: 300, category: 'pizza',   aiTags: ['halal'] },
  { id: 'm8',  restaurantId: 'r2', name: 'Pepperoni Feast',       description: 'Double pepperoni, mozzarella, oregano on a thick crispy crust.',                 price: 320, category: 'pizza',   aiTags: ['spicy'] },
  { id: 'm9',  restaurantId: 'r2', name: 'Veggie Supreme Pizza',  description: 'Bell peppers, mushrooms, olives, onions, cherry tomatoes.',                      price: 240, category: 'pizza',   aiTags: ['vegetarian', 'vegan'] },
  { id: 'm10', restaurantId: 'r2', name: 'Garlic Bread (6 pcs)',  description: 'Toasted garlic butter bread with herbs and mozzarella dip.',                     price: 90,  category: 'sides',   aiTags: ['vegetarian'] },

  // ── Noodle Nirvana (r3) ───────────────────────────────────────────────────
  { id: 'm11', restaurantId: 'r3', name: 'Beef Ramen',            description: 'Rich tonkotsu broth, thick noodles, chashu beef, soft boiled egg.',              price: 250, category: 'noodles', aiTags: ['halal', 'high-protein'] },
  { id: 'm12', restaurantId: 'r3', name: 'Spicy Miso Ramen',      description: 'Fiery miso broth, corn, bamboo shoots, green onion.',                            price: 230, category: 'noodles', aiTags: ['spicy', 'halal'] },
  { id: 'm13', restaurantId: 'r3', name: 'Pad Thai',              description: 'Stir-fried rice noodles, shrimp, tofu, peanuts, lime.',                          price: 190, category: 'noodles', aiTags: ['gluten-free'] },
  { id: 'm14', restaurantId: 'r3', name: 'Vegetable Fried Rice',  description: 'Wok-fried jasmine rice with garden veggies, soy sauce, sesame oil.',             price: 140, category: 'rice',    aiTags: ['vegan', 'vegetarian'] },
  { id: 'm15', restaurantId: 'r3', name: 'Dim Sum Basket (8pcs)', description: 'Steamed prawn dumplings with ginger soy dipping sauce.',                         price: 160, category: 'chinese', aiTags: ['halal'] },

  // ── Spice Garden (r4) — far away, NOT cluster eligible ───────────────────
  { id: 'm16', restaurantId: 'r4', name: 'Chicken Biryani',       description: 'Aromatic basmati rice slow-cooked with tender chicken and whole spices.',        price: 210, category: 'rice',    aiTags: ['halal', 'spicy'] },
  { id: 'm17', restaurantId: 'r4', name: 'Mutton Korma',          description: 'Slow-braised mutton in a rich cashew and cream sauce.',                          price: 290, category: 'curry',   aiTags: ['halal', 'high-protein'] },
  { id: 'm18', restaurantId: 'r4', name: 'Dal Makhani',           description: 'Creamy black lentils simmered overnight with butter and spices.',                price: 130, category: 'curry',   aiTags: ['vegetarian', 'gluten-free'] },
  { id: 'm19', restaurantId: 'r4', name: 'Garlic Naan (2 pcs)',   description: 'Soft leavened bread with roasted garlic and butter, baked in tandoor.',          price: 70,  category: 'sides',   aiTags: ['vegetarian'] },
  { id: 'm20', restaurantId: 'r4', name: 'Seekh Kebab Platter',   description: 'Minced beef seekh kebabs with mint chutney and sliced onions.',                  price: 240, category: 'grill',   aiTags: ['halal', 'high-protein'] },

  // ── Sweet Tooth (r5) ──────────────────────────────────────────────────────
  { id: 'm21', restaurantId: 'r5', name: 'Chocolate Lava Cake',   description: 'Warm chocolate cake with a gooey molten centre, served with vanilla ice cream.', price: 150, category: 'dessert', aiTags: ['vegetarian', 'sweet'] },
  { id: 'm22', restaurantId: 'r5', name: 'Mango Cheesecake',      description: 'Creamy no-bake cheesecake on a biscuit base, topped with fresh mango.',          price: 160, category: 'dessert', aiTags: ['vegetarian', 'sweet'] },
  { id: 'm23', restaurantId: 'r5', name: 'Strawberry Waffles',    description: 'Crispy Belgian waffles, fresh strawberries, whipped cream, maple syrup.',        price: 180, category: 'dessert', aiTags: ['vegetarian', 'sweet'] },
  { id: 'm24', restaurantId: 'r5', name: 'Nutella Banana Crepe',  description: 'Thin crepe filled with Nutella, banana slices and crushed hazelnuts.',           price: 130, category: 'dessert', aiTags: ['vegetarian', 'sweet'] },
  { id: 'm25', restaurantId: 'r5', name: 'Oreo Milkshake',        description: 'Thick blended milkshake with Oreo cookies and vanilla ice cream.',               price: 110, category: 'dessert', aiTags: ['vegetarian', 'sweet'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Haversine distance — calculates km between two GPS points
// ─────────────────────────────────────────────────────────────────────────────
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─────────────────────────────────────────────────────────────────────────────
// searchLocally — filters + sorts dummy data entirely in the browser
// ─────────────────────────────────────────────────────────────────────────────
const CLUSTER_RADIUS_KM = 2

const searchLocally = (query = '', filters = {}, userLocation = null) => {
  const { minPrice, maxPrice, cuisine } = filters
  const q = query.trim().toLowerCase()

  let results = DUMMY_ITEMS

  if (q) {
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.aiTags.some((tag) => tag.includes(q))
    )
  }

  if (minPrice) results = results.filter((i) => i.price >= Number(minPrice))
  if (maxPrice) results = results.filter((i) => i.price <= Number(maxPrice))
  if (cuisine)  results = results.filter((i) => i.category.toLowerCase() === cuisine.toLowerCase())

  const enriched = results.map((item) => {
    const restaurant = DUMMY_RESTAURANTS[item.restaurantId]
    let distanceKm = null
    let isClusterEligible = false

    if (userLocation && restaurant?.lat && restaurant?.lng) {
      distanceKm = haversineDistance(userLocation.lat, userLocation.lng, restaurant.lat, restaurant.lng)
      isClusterEligible = distanceKm <= CLUSTER_RADIUS_KM
    } else {
      // Without GPS: r1, r2, r3 are "close neighbours" by design
      isClusterEligible = ['r1', 'r2', 'r3'].includes(item.restaurantId)
    }

    return {
      menuItem: { id: item.id, name: item.name, description: item.description, price: item.price, category: item.category, aiTags: item.aiTags, restaurantId: item.restaurantId },
      restaurant,
      distanceKm,
      isClusterEligible,
    }
  })

  // Sort: cluster-eligible first → nearest → cheapest
  enriched.sort((a, b) => {
    if (a.isClusterEligible && !b.isClusterEligible) return -1
    if (!a.isClusterEligible && b.isClusterEligible) return 1
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm
    return a.menuItem.price - b.menuItem.price
  })

  return enriched
}

const ALL_CATEGORIES = [...new Set(DUMMY_ITEMS.map((i) => i.category))].sort()

// ─────────────────────────────────────────────────────────────────────────────
// Search Page
// ─────────────────────────────────────────────────────────────────────────────
const Search = () => {
  const [results, setResults]       = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [lastQuery, setLastQuery]   = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [cart, setCart]             = useState([])
  const [cartNotif, setCartNotif]   = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [categories, setCategories]       = useState(ALL_CATEGORIES) // fallback until API responds
  const [isDemoMode, setIsDemoMode]       = useState(false)

  // Load categories from the real API; silently fall back to the static hardcoded list
  useEffect(() => {
    fetchApiCategories()
      .then((cats) => { if (cats?.length) setCategories(cats) })
      .catch(() => {})
  }, [])

  // Initial load — try real API, fall back to local dummy data
  useEffect(() => {
    setSearchLoading(true)
    searchFood('', {})
      .then(({ results: apiResults }) => { setResults(apiResults); setIsDemoMode(false) })
      .catch(() => { setResults(searchLocally('', {}, null)); setIsDemoMode(true) })
      .finally(() => setSearchLoading(false))
  }, [])

  const handleSearch = useCallback(async (query, filters) => {
    setLastQuery(query)
    setHasSearched(true)
    setSearchLoading(true)
    const loc = filters.userLat && filters.userLng
      ? { lat: Number(filters.userLat), lng: Number(filters.userLng) }
      : userLocation
    if (filters.userLat && filters.userLng) setUserLocation(loc)
    try {
      const { results: apiResults } = await searchFood(query, filters)
      setResults(apiResults)
      setIsDemoMode(false)
    } catch {
      setResults(searchLocally(query, filters, loc))
      setIsDemoMode(true)
    } finally {
      setSearchLoading(false)
    }
  }, [userLocation])

  const handleAddToCart = (item) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.menuItem.id === item.menuItem.id)
      if (ex) return prev.map((c) => c.menuItem.id === item.menuItem.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
    setCartNotif(`${item.menuItem.name} added! 🛒`)
    setTimeout(() => setCartNotif(null), 2500)
  }

  const groups = Object.values(
    results.reduce((acc, item) => {
      const id = item.restaurant.id
      if (!acc[id]) acc[id] = { restaurant: item.restaurant, items: [], hasCluster: false }
      acc[id].items.push(item)
      if (item.isClusterEligible) acc[id].hasCluster = true
      return acc
    }, {})
  )

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky search header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <SearchBar onSearch={handleSearch} categories={categories} loading={searchLoading} />
        </div>
      </div>

      {/* Cart toast notification */}
      {cartNotif && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl">
          {cartNotif}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {!hasSearched ? '🍔 What are you craving?' : lastQuery ? `Results for "${lastQuery}"` : 'All Food'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {results.length} item{results.length !== 1 ? 's' : ''} across {groups.length} restaurant{groups.length !== 1 ? 's' : ''}
              {isDemoMode && <span className="text-xs text-orange-400 italic font-medium"> · demo mode</span>}
            </p>
          </div>

          {cartCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
              <span className="text-xl">🛒</span>
              <div className="text-sm">
                <p className="font-bold text-orange-700">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                <p className="text-orange-500 text-xs">৳{cartTotal.toFixed(0)}</p>
              </div>
            </div>
          )}
        </div>

        {/* No results */}
        {results.length === 0 && (
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-10 text-center">
            <span className="text-5xl">🍽️</span>
            <p className="mt-3 font-bold text-gray-700">Nothing found</p>
            <p className="text-sm text-gray-500 mt-1">Try different words or remove filters.</p>
          </div>
        )}

        {/* Results grouped by restaurant */}
        <div className="space-y-8">
          {groups.map(({ restaurant, items, hasCluster }) => (
            <section key={restaurant.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                  {restaurant.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900">{restaurant.name}</h2>
                  <p className="text-xs text-gray-400 truncate">{restaurant.address}</p>
                </div>
                <span className="text-sm font-semibold text-amber-500 shrink-0">
                  ⭐ {restaurant.avgRating}
                </span>
              </div>

              {hasCluster && (
                <div className="mb-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-4 py-2.5 flex items-center gap-2">
                  <span className="text-xl">🔗</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Cluster Delivery Available!</p>
                    <p className="text-xs text-emerald-600">Near other restaurants — order from multiple and save on delivery fees!</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <FoodCard key={item.menuItem.id} item={item} onAddToCart={handleAddToCart} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Search