import { useState, useEffect, useCallback } from 'react'
import SearchBar from '../../components/user/SearchBar'
import FoodCard from '../../components/user/FoodCard'
import { searchFood, getCategories } from '../../services/searchService'

/**
 * Search.jsx — The Smart Food Search Page
 *
 * This is the FULL search page. It's like the main stage of a show:
 * - SearchBar is the "control panel" at the top
 * - FoodCard grid is the "results stage" in the middle
 * - Empty/loading states handle the waiting moments
 *
 * Route: /search
 */
const Search = () => {
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [cart, setCart] = useState([]) // simple local cart for now
  const [cartNotif, setCartNotif] = useState(null) // toast notification text

  // Load food categories when the page first opens
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {}) // silent fail — filters just won't show categories
  }, [])

  // Called by SearchBar whenever the user changes anything
  const handleSearch = useCallback(async (query, filters) => {
    setLastQuery(query)
    setHasSearched(true)
    setLoading(true)
    setError(null)

    try {
      const data = await searchFood(query, filters)
      setResults(data.results ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError('Oops! Could not load results. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Called when user clicks "Add to Cart" on a FoodCard
  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.menuItem.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.menuItem.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    // Show a little notification
    setCartNotif(`${item.menuItem.name} added to cart! 🛒`)
    setTimeout(() => setCartNotif(null), 2500)
  }

  // Group results by restaurant for display
  const groupedByRestaurant = results.reduce((acc, item) => {
    const id = item.restaurant.id
    if (!acc[id]) {
      acc[id] = { restaurant: item.restaurant, items: [], hasCluster: false }
    }
    acc[id].items.push(item)
    if (item.isClusterEligible) acc[id].hasCluster = true
    return acc
  }, {})

  const restaurantGroups = Object.values(groupedByRestaurant)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <SearchBar
            onSearch={handleSearch}
            categories={categories}
            loading={loading}
          />
        </div>
      </div>

      {/* Cart notification toast */}
      {cartNotif && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl animate-bounce">
          {cartNotif}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {!hasSearched
                ? '🍔 What are you craving?'
                : lastQuery
                ? `Results for "${lastQuery}"`
                : 'All Available Food'}
            </h1>
            {hasSearched && !loading && (
              <p className="text-sm text-gray-500 mt-0.5">
                {total} item{total !== 1 ? 's' : ''} found across {restaurantGroups.length} restaurant
                {restaurantGroups.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Cart bubble */}
          {cart.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
              <span className="text-xl">🛒</span>
              <div className="text-sm">
                <p className="font-bold text-orange-700">{cart.reduce((s, i) => s + i.quantity, 0)} items</p>
                <p className="text-orange-500 text-xs">
                  ৳{cart.reduce((s, i) => s + i.menuItem.price * i.quantity, 0).toFixed(0)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── STATES ── */}

        {/* 1. Not searched yet — show a welcoming prompt */}
        {!hasSearched && (
          <WelcomeState />
        )}

        {/* 2. Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-gray-100 h-52 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* 3. Error */}
        {error && !loading && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center text-red-600">
            <span className="text-3xl">😕</span>
            <p className="mt-2 font-medium">{error}</p>
          </div>
        )}

        {/* 4. No results */}
        {hasSearched && !loading && !error && results.length === 0 && (
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-10 text-center">
            <span className="text-5xl">🍽️</span>
            <p className="mt-3 font-bold text-gray-700">Nothing found</p>
            <p className="text-sm text-gray-500 mt-1">
              Try different words, or remove some filters.
            </p>
          </div>
        )}

        {/* 5. Results — grouped by restaurant */}
        {!loading && !error && restaurantGroups.length > 0 && (
          <div className="space-y-8">
            {restaurantGroups.map(({ restaurant, items, hasCluster }) => (
              <RestaurantSection
                key={restaurant.id}
                restaurant={restaurant}
                items={items}
                hasCluster={hasCluster}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Restaurant Section ─────────────────────────────────────────────── */
/**
 * Groups all food items from one restaurant under a nice header.
 * Shows the restaurant name, rating, and a "cluster savings" banner if eligible.
 */
const RestaurantSection = ({ restaurant, items, hasCluster, onAddToCart }) => (
  <section>
    {/* Restaurant header */}
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
        {restaurant.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-gray-900 truncate">{restaurant.name}</h2>
        <p className="text-xs text-gray-400 truncate">{restaurant.address}</p>
      </div>
      {restaurant.avgRating > 0 && (
        <span className="text-sm font-semibold text-amber-500 shrink-0">
          ⭐ {Number(restaurant.avgRating).toFixed(1)}
        </span>
      )}
    </div>

    {/* Cluster savings banner */}
    {hasCluster && (
      <div className="mb-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-4 py-2.5 flex items-center gap-2">
        <span className="text-xl">🔗</span>
        <div>
          <p className="text-sm font-bold text-emerald-700">Cluster Delivery Available!</p>
          <p className="text-xs text-emerald-600">
            This restaurant is close to others. Order from multiple and save on delivery fees!
          </p>
        </div>
      </div>
    )}

    {/* Food cards grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <FoodCard key={item.menuItem.id} item={item} onAddToCart={onAddToCart} />
      ))}
    </div>
  </section>
)

/* ─── Welcome State ──────────────────────────────────────────────────── */
const WelcomeState = () => (
  <div className="text-center py-16">
    <div className="text-6xl mb-4">🍜</div>
    <h2 className="text-xl font-bold text-gray-700 mb-2">Search for your favourite food</h2>
    <p className="text-gray-400 text-sm max-w-sm mx-auto">
      Type any food name above — burgers, pizza, pasta, rice... We'll find it from all restaurants!
    </p>
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {['🍔 Burger', '🍕 Pizza', '🍜 Noodles', '🍛 Rice', '🌮 Wrap', '🍰 Dessert'].map((s) => (
        <span key={s} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 shadow-sm">
          {s}
        </span>
      ))}
    </div>
  </div>
)

export default Search