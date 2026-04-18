// frontend/src/pages/user/Cart.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Member 1 — Multi-Restaurant Cart + Delivery Fee + ETA display.
//
// UPGRADES over the previous version:
//   • Adds THREE fallbacks for setting the delivery location, so the cart
//     is never stuck when browser geolocation is blocked:
//       1. "Use my GPS" button — same as before
//       2. "Pick on map" button — opens the full LocationPickerMap modal
//       3. "Use Dhaka (test)" button — 1-click location for demos
//       4. Manual lat/lng form — for any coords anywhere
//   • Keeps every existing behavior: cluster banner, ClusterBanner component,
//     CartSummary with ETA pill, place-order flow.
//
// No backend code was changed — this file only calls existing endpoints via
// the CartContext and orderService.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import CartItem from '../../components/user/CartItem'
import CartSummary from '../../components/user/CartSummary'
import ClusterBanner from '../../components/user/ClusterBanner'
import LocationPickerMap from '../../components/user/LocationPickerMap'
import { placeOrder } from '../../services/orderService'
import { toast } from 'sonner'

// Test coordinates that sit right on the seed-data Cluster A (Gulshan).
// Using these guarantees the cluster banner + ETA render as expected.
const DHAKA_DEFAULT = { lat: 23.7808, lng: 90.4154 }

const Cart = () => {
  const {
    items,
    itemsByRestaurant,
    clusterStatus,
    checkingCluster,
    subtotal,
    itemCount,
    clearCart,
    setUserLocation,
    userLocation,
  } = useCart()

  const [placingOrder, setPlacingOrder] = useState(false)
  const [locationStatus, setLocationStatus] = useState(
    userLocation ? 'granted' : 'idle'
  )
  const [showManualForm, setShowManualForm] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')

  // Keep the local "granted" indicator in sync with context (covers the case
  // where location was set by another page — e.g. the map picker on Search).
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) setLocationStatus('granted')
  }, [userLocation])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      toast.error('Your browser does not support geolocation.')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude)
        setLocationStatus('granted')
        toast.success('Location set from GPS')
      },
      (err) => {
        setLocationStatus('denied')
        const msg =
          err?.code === 1
            ? 'Location permission was denied.'
            : err?.code === 2
              ? 'Location unavailable on this device.'
              : 'Could not get your location.'
        toast.error(msg + ' You can use the manual options below.')
      },
      { timeout: 7000 }
    )
  }

  const useDhakaTestLocation = () => {
    setUserLocation(DHAKA_DEFAULT.lat, DHAKA_DEFAULT.lng)
    setLocationStatus('granted')
    toast.success('Using Dhaka (Gulshan) as delivery location')
  }

  const submitManualLocation = (e) => {
    e.preventDefault()
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Please enter a valid latitude (-90..90) and longitude (-180..180).')
      return
    }
    setUserLocation(lat, lng)
    setLocationStatus('granted')
    setShowManualForm(false)
    toast.success(`Using ${lat.toFixed(4)}, ${lng.toFixed(4)} as delivery location`)
  }

  const handleClearCart = () => {
    clearCart()
    toast.success('Cart cleared.')
  }

  const handlePlaceOrder = async () => {
    if (!items.length) return
    if (!userLocation?.lat || !userLocation?.lng) {
      toast.error('Please set your delivery location before ordering.')
      return
    }

    setPlacingOrder(true)
    try {
      const payload = {
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          restaurantId: i.restaurantId,
          quantity: i.quantity,
        })),
        restaurantIds: [...new Set(items.map((i) => i.restaurantId))],
        userLat: userLocation.lat,
        userLng: userLocation.lng,
        isCluster: Boolean(clusterStatus?.eligible),
      }
      const result = await placeOrder(payload)
      clearCart()
      toast.success(`Order placed — ID ${String(result.orderId).slice(0, 8).toUpperCase()}`)
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Couldn't place your order. Please try again."
      )
    } finally {
      setPlacingOrder(false)
    }
  }

  // ─── Empty cart state ───────────────────────────────────────────────────
  if (!items.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-6xl">🛒</span>
        <h2 className="text-2xl font-black text-gray-800">Your cart is empty</h2>
        <p className="text-gray-500 text-sm">Add food from the search page to get started.</p>
        <Link
          to="/search"
          className="mt-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          Browse Food
        </Link>
      </div>
    )
  }

  const restaurantGroups = Object.values(itemsByRestaurant)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Your Cart</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {itemCount} item{itemCount !== 1 ? 's' : ''} from{' '}
              {restaurantGroups.length} restaurant
              {restaurantGroups.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleClearCart}
            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
          >
            Clear cart
          </button>
        </div>

        {/* ─── Location controls ──────────────────────────────────────────── */}
        {locationStatus !== 'granted' ? (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
            <div>
              <p className="text-sm font-bold text-blue-800">📍 Set your delivery location</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Required to check cluster eligibility, calculate delivery fee, and
                show your estimated delivery time.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={requestLocation}
                disabled={locationStatus === 'loading'}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {locationStatus === 'loading' ? 'Getting GPS…' : 'Use my GPS'}
              </button>
              <button
                onClick={() => setShowMapPicker(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                🗺️ Pick on map
              </button>
              <button
                onClick={useDhakaTestLocation}
                className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
              >
                Use Dhaka (test)
              </button>
              <button
                onClick={() => setShowManualForm((v) => !v)}
                className="px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 bg-white text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                Enter coordinates
              </button>
            </div>

            {showManualForm && (
              <form
                onSubmit={submitManualLocation}
                className="flex flex-wrap items-end gap-2 pt-2 border-t border-blue-100"
              >
                <label className="text-xs font-semibold text-blue-800">
                  Latitude
                  <input
                    type="number"
                    step="any"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="23.7808"
                    className="block w-32 mt-0.5 px-2 py-1.5 rounded-md border border-blue-200 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-semibold text-blue-800">
                  Longitude
                  <input
                    type="number"
                    step="any"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="90.4154"
                    className="block w-32 mt-0.5 px-2 py-1.5 rounded-md border border-blue-200 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Apply
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-emerald-700">
              ✅ Delivery location set: {userLocation.lat.toFixed(4)},{' '}
              {userLocation.lng.toFixed(4)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMapPicker(true)}
                className="text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-md px-2.5 py-1 hover:bg-emerald-100 transition-colors"
              >
                🗺️ Edit on map
              </button>
              <button
                onClick={() => setLocationStatus('idle')}
                className="text-xs text-emerald-700 hover:text-emerald-900 underline"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* Cluster banner (only when 2+ restaurants in cart) */}
        {restaurantGroups.length > 1 && (
          <div className="mb-5">
            <ClusterBanner clusterStatus={clusterStatus} checkingCluster={checkingCluster} />
          </div>
        )}

        {/* Restaurant sections */}
        <div className="space-y-4 mb-6">
          {restaurantGroups.map(({ restaurantId, restaurantName, items: groupItems }) => (
            <div
              key={restaurantId}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-sm">
                  {restaurantName?.[0] || '?'}
                </div>
                <span className="font-semibold text-gray-800 text-sm">{restaurantName}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {groupItems.length} item{groupItems.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="px-4 divide-y divide-gray-50">
                {groupItems.map((item) => (
                  <CartItem key={item.menuItemId} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order summary — shows ETA via CartSummary */}
        <CartSummary
          subtotal={subtotal}
          clusterStatus={clusterStatus}
          onPlaceOrder={handlePlaceOrder}
          placingOrder={placingOrder}
        />
      </div>

      {/*
        Map picker modal — LocationPickerMap is self-contained (renders its
        own overlay + header + presets + confirm footer). We just toggle it
        open and handle the confirmed pick.
      */}
      <LocationPickerMap
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        initialLocation={
          userLocation?.lat && userLocation?.lng
            ? { lat: userLocation.lat, lng: userLocation.lng }
            : DHAKA_DEFAULT
        }
        onConfirm={(picked) => {
          setUserLocation(picked.lat, picked.lng)
          setLocationStatus('granted')
          toast.success(
            `Location set: ${picked.lat.toFixed(4)}, ${picked.lng.toFixed(4)}`
          )
        }}
      />
    </div>
  )
}

export default Cart