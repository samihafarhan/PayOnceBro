import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

/**
 * SearchBar.jsx
 *
 * This is the search box + filter panel at the top of the Search page.
 *
 * It has:
 * - A text input where users type food names
 * - A price range filter (min ৳ and max ৳)
 * - A cuisine/category dropdown
 * - A "Use my location" button
 *
 * Props:
 *   onSearch(query, filters) - called whenever any filter changes
 *   categories               - array of category strings for the dropdown
 *   loading                  - shows a spinner in the search box
 */
const SearchBar = ({ onSearch, categories = [], loading = false }) => {
  const [query, setQuery] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [location, setLocation] = useState(null) // { lat, lng }
  const [locationStatus, setLocationStatus] = useState('idle') // idle | loading | granted | denied
  const [showFilters, setShowFilters] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (locationStatus !== 'denied') return
    toast.error('Location access denied. Showing price-sorted results.')
  }, [locationStatus])

  // Every time ANY filter changes, we wait 400ms then call onSearch.
  // "Debouncing" = waiting a little bit so we don't search on every single
  // keystroke. Like waiting for someone to finish talking before responding!
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(query, {
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        cuisine: cuisine || undefined,
        userLat: location?.lat,
        userLng: location?.lng,
      })
    }, 400)

    return () => clearTimeout(debounceRef.current)
  }, [query, minPrice, maxPrice, cuisine, location, onSearch])

  // Ask the browser for the user's GPS location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('granted')
      },
      () => setLocationStatus('denied')
    )
  }

  const hasActiveFilters = minPrice || maxPrice || cuisine

  return (
    <div className="space-y-3">
      {/* Main search row */}
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for food... (e.g. burger, pasta, rice)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin text-lg">
              ⏳
            </span>
          )}
        </div>

        {/* Filters toggle button */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          🎛️ Filter{hasActiveFilters ? ' •' : ''}
        </button>

        {/* Location button */}
        <button
          onClick={requestLocation}
          disabled={locationStatus === 'loading'}
          title={
            locationStatus === 'granted'
              ? 'Location active — nearby restaurants shown first'
              : 'Click to show nearby restaurants first'
          }
          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
            locationStatus === 'granted'
              ? 'bg-emerald-500 text-white border-emerald-500'
              : locationStatus === 'denied'
              ? 'bg-red-50 text-red-500 border-red-200'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {locationStatus === 'loading'
            ? '⏳'
            : locationStatus === 'granted'
            ? '📍'
            : locationStatus === 'denied'
            ? '🚫'
            : '📍?'}
        </button>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
          {/* Min price */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Min Price (৳)
            </label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          {/* Max price */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Max Price (৳)
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          {/* Cuisine / category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Cuisine Type
            </label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            >
              <option value="">All cuisines</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={() => {
                  setMinPrice('')
                  setMaxPrice('')
                  setCuisine('')
                }}
                className="text-xs text-gray-500 hover:text-red-500 underline transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Location tip */}
      {locationStatus === 'granted' && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <span>✅</span> Location active — nearby restaurants shown first and cluster savings highlighted
        </p>
      )}
    </div>
  )
}

export default SearchBar