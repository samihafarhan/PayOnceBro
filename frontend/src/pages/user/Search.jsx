// frontend/src/pages/user/Search.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Member 1 — Feature 1 (Smart Food Search) + entrypoint for Feature 2 tab.
//
// CHANGES from previous version:
//   • Removed DUMMY_RESTAURANTS / DUMMY_ITEMS / searchLocally fallback entirely
//   • Removed "demo mode" indicator — backend is the sole source of truth
//   • Empty results now show a proper empty state, not fake data
//   • "Nearby & Clustering" tab now uses the new real-backend view
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '../../components/user/SearchBar'
import FoodCard from '../../components/user/FoodCard'
import LocationPickerMap from '../../components/user/LocationPickerMap'
import NearbyRestaurantsView from '../../components/user/NearbyRestaurantsView'
import {
  searchFood,
  getCategories as fetchApiCategories,
} from '../../services/searchService'
import { useCart } from '../../context/CartContext'
import { toast } from 'sonner'

// Fallback map location if geolocation is blocked (Dhaka, Gulshan area).
// This intentionally sits near the seed cluster so the clustering demo works.
const DHAKA_DEFAULT = { lat: 23.7808, lng: 90.4154 }

const Search = () => {
  // ─── Map location (used by the Nearby tab and the map picker) ─────────
  const [mapLocation, setMapLocation] = useState(DHAKA_DEFAULT)
  const [locationStatus, setLocationStatus] = useState('detecting')
  //   detecting | gps | default | manual

  // Try browser geolocation once on mount. Silently fall back to Dhaka default.
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('default')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('gps')
      },
      () => setLocationStatus('default'),
      { timeout: 5000 }
    )
  }, [])

  // ─── Tab state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('search') // 'search' | 'nearby'

  // ─── Food search state ────────────────────────────────────────────────
  const [results, setResults] = useState([])
  const [lastQuery, setLastQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [categories, setCategories] = useState([])

  const { addItem, itemCount, subtotal } = useCart()

  // Populate cuisine dropdown from the backend
  useEffect(() => {
    fetchApiCategories()
      .then((cats) => {
        if (Array.isArray(cats)) setCategories(cats)
      })
      .catch(() => setCategories([]))
  }, [])

  // First load — all items (no query, no filters)
  useEffect(() => {
    setSearchLoading(true)
    setSearchError(null)
    searchFood('', {})
      .then(({ results: r }) => setResults(r ?? []))
      .catch((err) => {
        setSearchError(
          err?.response?.data?.message || 'Failed to load food. Is the backend running?'
        )
        setResults([])
      })
      .finally(() => setSearchLoading(false))
  }, [])

  // Debounced search handler wired into SearchBar
  const handleSearch = useCallback(async (query, filters) => {
    setLastQuery(query)
    setSearchLoading(true)
    setSearchError(null)
    try {
      const { results: r } = await searchFood(query, filters)
      setResults(r ?? [])
    } catch (err) {
      setSearchError(err?.response?.data?.message || 'Search failed. Please try again.')
      setResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Group search results by restaurant for display
  const groups = useMemo(() => {
    const map = new Map()
    results.forEach((row) => {
      const rid = row.restaurant?.id
      if (!rid) return
      if (!map.has(rid)) {
        map.set(rid, {
          restaurant: row.restaurant,
          items: [],
          hasCluster: Boolean(row.isClusterEligible),
        })
      }
      map.get(rid).items.push(row)
    })
    return [...map.values()]
  }, [results])

  const handleAddToCart = (row) => {
    addItem(
      { id: row.menuItem.id, name: row.menuItem.name, price: Number(row.menuItem.price) },
      { id: row.restaurant.id, name: row.restaurant.name }
    )
    toast.success(`${row.menuItem.name} added to cart`)
  }

  // Location-picker modal visibility
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-4">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-gray-900">PayOnceBro</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              📍{' '}
              {locationStatus === 'detecting'
                ? 'Detecting your location…'
                : locationStatus === 'gps'
                  ? 'Using your GPS location'
                  : locationStatus === 'manual'
                    ? 'Using a location you set'
                    : 'Using Dhaka (Gulshan) — default'}
              <button
                onClick={() => setShowLocationPicker(true)}
                className="text-orange-600 hover:text-orange-700 underline ml-1 font-semibold"
              >
                Change
              </button>
            </p>
          </div>
          {itemCount > 0 && (
            <Link
              to="/cart"
              className="shrink-0 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 hover:bg-orange-100 transition"
            >
              <span className="text-lg">🛒</span>
              <div className="text-xs">
                <p className="font-bold text-orange-700">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </p>
                <p className="text-orange-500">৳{subtotal.toFixed(0)}</p>
              </div>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-5">
          {[
            { key: 'search', label: '🔍 All food' },
            { key: 'nearby', label: '🔗 Nearby & Clustering' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === t.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ───────── TAB 1: All food (search) ───────────────────────────── */}
        {activeTab === 'search' && (
          <>
            <div className="mb-5">
              <SearchBar
                onSearch={handleSearch}
                categories={categories}
                loading={searchLoading}
              />
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {searchLoading
                    ? '🍔 What are you craving?'
                    : lastQuery
                      ? `Results for "${lastQuery}"`
                      : 'All food'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {results.length} item{results.length !== 1 ? 's' : ''} across{' '}
                  {groups.length} restaurant{groups.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {searchError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">
                {searchError}
              </div>
            )}

            {!searchError && !searchLoading && results.length === 0 && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-10 text-center">
                <span className="text-5xl">🍽️</span>
                <p className="mt-3 font-bold text-gray-700">Nothing found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try different search terms, clear filters, or seed the database.
                </p>
              </div>
            )}

            <div className="space-y-8">
              {groups.map(({ restaurant, items, hasCluster }) => (
                <section key={restaurant.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                      {restaurant.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/restaurants/${restaurant.id}`}
                        className="font-bold text-gray-900 hover:text-orange-600 transition"
                      >
                        {restaurant.name}
                      </Link>
                      <p className="text-xs text-gray-400 truncate">
                        {restaurant.address}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-amber-500 shrink-0">
                      ⭐ {Number(restaurant.avgRating || 0).toFixed(1)}
                    </span>
                  </div>

                  {hasCluster && (
                    <div className="mb-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-4 py-2.5 flex items-center gap-2">
                      <span className="text-xl">🔗</span>
                      <div>
                        <p className="text-sm font-bold text-emerald-700">
                          Cluster Delivery Available!
                        </p>
                        <p className="text-xs text-emerald-600">
                          Near other restaurants — order from multiple and save on
                          delivery fees.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((row) => (
                      <FoodCard
                        key={row.menuItem.id}
                        item={row}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        {/* ───────── TAB 2: Nearby & Clustering ─────────────────────────── */}
        {activeTab === 'nearby' && (
          <NearbyRestaurantsView userLocation={mapLocation} />
        )}
      </div>

      {/*
        Location picker modal.
        LocationPickerMap is a self-contained modal — it renders its own
        fixed/overlay wrapper, a Leaflet map with click-to-move-pin, and
        preset buttons (Gulshan, Dhanmondi, etc.). We just control its
        open state and handle its onConfirm callback.
      */}
      <LocationPickerMap
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        initialLocation={mapLocation}
        onConfirm={(picked) => {
          setMapLocation({ lat: picked.lat, lng: picked.lng })
          setLocationStatus('manual')
        }}
      />
    </div>
  )
}

export default Search