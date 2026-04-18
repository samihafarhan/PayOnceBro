// frontend/src/pages/user/RestaurantProfile.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Member 1 — User-facing Restaurant Profile page.
//
// Route: /restaurants/:id
//
// Replaces the earlier placeholder stub. Shows:
//   • Restaurant header (name, cuisine, address, rating, avg prep time)
//   • Tabbed content: Menu (with add-to-cart) and Reviews (read-only)
//
// Consumes:
//   • Our new backend endpoint: GET /api/public/restaurants/:id  (NEW, Member 1)
//   • Member 3's existing public endpoint: GET /api/ratings/restaurant/:id
//     (consumed only — their files are untouched)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getPublicRestaurant,
  getPublicRestaurantReviews,
} from '../../services/publicRestaurantService'
import RestaurantMenuList from '../../components/user/RestaurantMenuList'
import RestaurantReviewsList from '../../components/user/RestaurantReviewsList'
import { useCart } from '../../context/CartContext'
import { toast } from 'sonner'

const Stars = ({ score = 0 }) => {
  const n = Math.round(Number(score) || 0)
  return (
    <span className="text-amber-500 text-sm" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? '' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

const RestaurantProfile = () => {
  const { id } = useParams()
  const { itemCount, subtotal } = useCart()

  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [reviews, setReviews] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('menu') // 'menu' | 'reviews'

  // Fetch profile + menu
  useEffect(() => {
    let cancelled = false
    const loadProfile = async () => {
      setLoadingProfile(true)
      setError(null)
      try {
        const data = await getPublicRestaurant(id)
        if (cancelled) return
        setRestaurant(data.restaurant)
        setMenu(Array.isArray(data.menu) ? data.menu : [])
      } catch (err) {
        if (cancelled) return
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load this restaurant.'
        setError(msg)
        toast.error(msg)
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }
    loadProfile()
    return () => {
      cancelled = true
    }
  }, [id])

  // Fetch reviews (best-effort — never blocks the menu)
  useEffect(() => {
    let cancelled = false
    const loadReviews = async () => {
      setLoadingReviews(true)
      try {
        const list = await getPublicRestaurantReviews(id)
        if (!cancelled) setReviews(list)
      } catch {
        if (!cancelled) setReviews([])
      } finally {
        if (!cancelled) setLoadingReviews(false)
      }
    }
    loadReviews()
    return () => {
      cancelled = true
    }
  }, [id])

  // ─── Loading state ──────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  // ─── Error state ────────────────────────────────────────────────────────
  if (error || !restaurant) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || 'Restaurant not found or currently inactive.'}
        </div>
        <Link
          to="/search"
          className="inline-block mt-4 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          ← Back to search
        </Link>
      </div>
    )
  }

  // ─── Main view ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      {/* Back link */}
      <Link
        to="/search"
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 mb-4"
      >
        ← Back to search
      </Link>

      {/* Restaurant header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-40 object-cover bg-gray-100"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-32 bg-linear-to-br from-orange-400 to-rose-500" />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-gray-900 truncate">
                {restaurant.name}
              </h1>
              {restaurant.cuisine && (
                <p className="text-xs text-gray-500 mt-0.5">{restaurant.cuisine}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <Stars score={restaurant.avg_rating} />
              <p className="text-xs text-gray-500 mt-0.5">
                {Number(restaurant.avg_rating || 0).toFixed(1)} ({reviews.length} review
                {reviews.length !== 1 ? 's' : ''})
              </p>
            </div>
          </div>

          {restaurant.address && (
            <p className="text-sm text-gray-600 mt-3 flex items-start gap-1">
              <span>📍</span>
              <span>{restaurant.address}</span>
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {restaurant.avg_prep_time ? (
              <span className="text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1">
                ⏱ ~{restaurant.avg_prep_time} min prep
              </span>
            ) : null}
            {restaurant.phone ? (
              <span className="text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1">
                📞 {restaurant.phone}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {[
          { key: 'menu',    label: `Menu (${menu.length})` },
          { key: 'reviews', label: `Reviews (${reviews.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'menu' ? (
        <RestaurantMenuList menu={menu} restaurant={restaurant} />
      ) : (
        <RestaurantReviewsList reviews={reviews} loading={loadingReviews} />
      )}

      {/* Sticky cart bar (shown only when cart has items) */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 bg-linear-to-t from-gray-50 via-gray-50/95 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <Link
              to="/cart"
              className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-gray-900 text-white shadow-2xl hover:bg-gray-800 active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <div className="text-left">
                  <p className="text-xs text-gray-300">
                    {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
                  </p>
                  <p className="text-sm font-bold">৳{subtotal.toFixed(0)} + delivery</p>
                </div>
              </div>
              <span className="text-sm font-bold">View cart →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantProfile
