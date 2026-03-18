// frontend/src/pages/user/Cart.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import CartItem from '../../components/user/CartItem'
import CartSummary from '../../components/user/CartSummary'
import ClusterBanner from '../../components/user/ClusterBanner'

const Cart = () => {
  const {
    items, itemsByRestaurant, clusterStatus, checkingCluster,
    subtotal, itemCount, clearCart, setUserLocation, userLocation,
  } = useCart()

  const [placingOrder, setPlacingOrder]   = useState(false)
  const [locationStatus, setLocationStatus] = useState(userLocation ? 'granted' : 'idle')

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('denied'); return }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation(pos.coords.latitude, pos.coords.longitude); setLocationStatus('granted') },
      () => setLocationStatus('denied')
    )
  }

  // Sprint 3: replace this with a real orderService.placeOrder() call
  const handlePlaceOrder = async () => {
    if (!items.length) return
    setPlacingOrder(true)
    try {
      alert('Order placement is coming in Sprint 3! Your cart is ready.')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-6xl">🛒</span>
        <h2 className="text-2xl font-black text-gray-800">Your cart is empty</h2>
        <p className="text-gray-500 text-sm">Add food from the search page to get started.</p>
        <Link to="/search" className="mt-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors">
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
              {itemCount} item{itemCount !== 1 ? 's' : ''} from {restaurantGroups.length} restaurant{restaurantGroups.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
            Clear cart
          </button>
        </div>

        {/* Location prompt (needed for cluster check + fee) */}
        {locationStatus !== 'granted' && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-800">📍 Share your location</p>
              <p className="text-xs text-blue-600 mt-0.5">Required to calculate delivery fee and check cluster eligibility.</p>
            </div>
            <button
              onClick={requestLocation}
              disabled={locationStatus === 'loading'}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {locationStatus === 'loading' ? 'Getting…' : 'Allow'}
            </button>
          </div>
        )}
        {locationStatus === 'denied' && (
          <p className="mb-4 text-xs text-red-500">❌ Location denied — delivery fee and cluster check unavailable.</p>
        )}

        {/* Cluster banner (only shown when 2+ restaurants in cart) */}
        {restaurantGroups.length > 1 && (
          <div className="mb-5">
            <ClusterBanner clusterStatus={clusterStatus} checkingCluster={checkingCluster} />
          </div>
        )}

        {/* Restaurant sections */}
        <div className="space-y-4 mb-6">
          {restaurantGroups.map(({ restaurantId, restaurantName, items: groupItems }) => (
            <div key={restaurantId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-sm">
                  {restaurantName[0]}
                </div>
                <span className="font-semibold text-gray-800 text-sm">{restaurantName}</span>
                <span className="ml-auto text-xs text-gray-400">{groupItems.length} item{groupItems.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="px-4 divide-y divide-gray-50">
                {groupItems.map((item) => <CartItem key={item.menuItemId} item={item} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <CartSummary
          subtotal={subtotal}
          clusterStatus={clusterStatus}
          onPlaceOrder={handlePlaceOrder}
          placingOrder={placingOrder}
        />

      </div>
    </div>
  )
}

export default Cart