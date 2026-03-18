// frontend/src/components/user/NearbyRestaurantsView.jsx
//
// Shows demo restaurants grouped as Cluster or Standalone.
// Imports shared data from utils/demoRestaurants.js (same data the map uses).
//
// Delivery fee rules:
//   All cart items from ONE cluster  → cluster (discounted) fee
//   Any mix (cross-cluster/standard) → sum of individual fees

import { useMemo, useState } from 'react'
import {
  haversine,
  allPairsWithinRadius,
  generateRestaurants,
  MENUS,
  CLUSTER_COLORS,
} from '../../utils/demoRestaurants'

// ─── Delivery fee calculator ──────────────────────────────────────────────────
const calcFee = (restaurants, userLat, userLng, isCluster) => {
  const BASE = 20, PER_KM = 10, DISCOUNT = 0.6
  const distances = restaurants.map(r => haversine(userLat, userLng, r.lat, r.lng))
  const normalTotal = distances.reduce((s, d) => s + BASE + d * PER_KM, 0)
  if (!isCluster) {
    return {
      fee: Math.round(normalTotal),
      savings: 0,
      breakdown: restaurants.map((r, i) => ({
        name: r.name,
        fee: Math.round(BASE + distances[i] * PER_KM),
      })),
    }
  }
  const maxDist = Math.max(...distances)
  const clusterFee = (BASE + maxDist * PER_KM) * DISCOUNT
  return {
    fee: Math.round(clusterFee),
    savings: Math.round(normalTotal - clusterFee),
    breakdown: restaurants.map((r, i) => ({
      name: r.name,
      fee: Math.round(BASE + distances[i] * PER_KM),
    })),
  }
}

// ─── Determine delivery type + fee for the current cart ──────────────────────
const getDeliveryInfo = (cartItems, allRestaurants, userLat, userLng) => {
  const uniqueIds = [...new Set(cartItems.map(i => i.restaurantId))]
  if (uniqueIds.length === 0) return null

  const cartRestaurants = uniqueIds
    .map(id => allRestaurants.find(r => r.id === id))
    .filter(Boolean)

  const cartGroups = [...new Set(cartRestaurants.map(r => r.group))]
  const allInSameCluster = cartGroups.length === 1 && cartGroups[0] !== null

  if (allInSameCluster) {
    const feeInfo = calcFee(cartRestaurants, userLat, userLng, true)
    return {
      ...feeInfo,
      type: 'cluster',
      clusterGroup: cartGroups[0],
      label: `Cluster ${cartGroups[0]} delivery`,
    }
  }

  const feeInfo = calcFee(cartRestaurants, userLat, userLng, false)
  const hasClusterRestaurants = cartGroups.some(g => g !== null)
  const hasStandalone = cartGroups.includes(null)
  const mixedClusters = cartGroups.filter(Boolean).length > 1

  const label = mixedClusters
    ? 'Multiple clusters — individual fees'
    : hasClusterRestaurants && hasStandalone
      ? 'Cluster + Standard — individual fees'
      : 'Standard delivery'

  return { ...feeInfo, type: 'mixed', label }
}

// ─── MenuItem row ─────────────────────────────────────────────────────────────
const MenuItem = ({ item, restaurantId, cartItems, onAdd, onRemove }) => {
  const qty = cartItems.find(c => c.itemId === item.id)?.quantity ?? 0

  return (
    <div className="flex items-center justify-between py-2.5
                    border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-sm font-medium text-gray-800">{item.name}</p>
        <p className="text-xs text-orange-600 font-semibold mt-0.5">৳{item.price}</p>
      </div>

      {qty === 0 ? (
        <button
          onClick={() => onAdd(restaurantId, item)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500
                     text-white text-xs font-bold hover:bg-orange-600
                     active:scale-95 transition-all"
        >
          + Add
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRemove(restaurantId, item.id)}
            className="w-7 h-7 rounded-full border-2 border-orange-400 text-orange-500
                       font-bold text-base flex items-center justify-center
                       hover:bg-orange-50 active:scale-95 transition-all"
          >
            −
          </button>
          <span className="w-5 text-center text-sm font-bold text-gray-800">{qty}</span>
          <button
            onClick={() => onAdd(restaurantId, item)}
            className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold
                       text-base flex items-center justify-center
                       hover:bg-orange-600 active:scale-95 transition-all"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Restaurant card (expandable) ────────────────────────────────────────────
const RestaurantCard = ({
  restaurant,
  clusterColor,
  isExpanded,
  onToggle,
  cartItems,
  onAdd,
  onRemove,
}) => {
  const menu     = MENUS[restaurant.id] ?? []
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0)
  const cartSub   = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const isCluster = !!clusterColor

  // Border colour: cluster group colour or grey
  const borderStyle = isExpanded
    ? { border: `2px solid ${clusterColor ?? '#9ca3af'}` }
    : { border: `2px solid ${clusterColor ? clusterColor + '66' : '#e5e7eb'}` }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 bg-white shadow-sm"
      style={borderStyle}
    >
      {/* Header — always visible, click to expand */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        {/* Emoji avatar with cluster colour */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center
                     text-2xl shrink-0"
          style={{ background: clusterColor ? clusterColor + '18' : '#f3f4f6' }}
        >
          {restaurant.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">{restaurant.name}</span>

            {/* Cluster badge */}
            {isCluster && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: clusterColor + '20',
                  color: clusterColor,
                  border: `1px solid ${clusterColor}44`,
                }}
              >
                🔗 Cluster {restaurant.group}
              </span>
            )}

            {/* Cart count badge */}
            {itemCount > 0 && (
              <span className="text-xs font-bold text-white bg-orange-500
                               rounded-full px-2 py-0.5 ml-auto shrink-0">
                {itemCount} in cart · ৳{cartSub}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
            <span>⭐ {restaurant.avgRating}</span>
            <span>·</span>
            <span>📍 {restaurant.distanceKm} km</span>
            <span>·</span>
            <span>⏱ {restaurant.avgPrepTime} min</span>
          </div>
        </div>

        {/* Chevron */}
        <span className={`text-gray-400 text-xs transition-transform duration-200 shrink-0
                          ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Menu — shown when expanded */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-400 mb-2">
            Tap <strong>+ Add</strong> to add items to your cart
          </p>
          {menu.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              restaurantId={restaurant.id}
              cartItems={cartItems}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sticky cart bar ──────────────────────────────────────────────────────────
const CartBar = ({ cartItems, allRestaurants, userLat, userLng, onClear }) => {
  if (cartItems.length === 0) return null

  const subtotal     = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryInfo = getDeliveryInfo(cartItems, allRestaurants, userLat, userLng)
  const total        = subtotal + (deliveryInfo?.fee ?? 0)
  const totalItems   = cartItems.reduce((s, i) => s + i.quantity, 0)

  const bannerColor = deliveryInfo?.type === 'cluster'
    ? CLUSTER_COLORS[deliveryInfo.clusterGroup] ?? '#059669'
    : '#374151'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2
                    bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent
                    pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        <div className="rounded-2xl bg-gray-900 text-white shadow-2xl overflow-hidden">

          {/* Delivery type banner */}
          <div
            className="px-4 py-1.5 text-xs font-semibold flex items-center gap-2"
            style={{ background: bannerColor }}
          >
            {deliveryInfo?.type === 'cluster' ? (
              <>
                🔗 {deliveryInfo.label}
                {deliveryInfo.savings > 0 && (
                  <span className="ml-auto opacity-80">
                    Saving ৳{deliveryInfo.savings} vs separate orders
                  </span>
                )}
              </>
            ) : (
              <>🚚 {deliveryInfo?.label}</>
            )}
          </div>

          {/* Main row */}
          <div className="px-4 py-3 flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-400">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </p>
              <p className="text-sm font-bold">
                ৳{subtotal} + ৳{deliveryInfo?.fee ?? 0} delivery
              </p>
            </div>

            <div className="ml-auto text-right shrink-0">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-lg font-black">৳{total}</p>
            </div>

            <button
              onClick={onClear}
              className="shrink-0 px-3 py-2 rounded-xl border border-gray-600
                         text-gray-300 text-xs font-medium
                         hover:bg-gray-800 transition-colors"
            >
              Clear
            </button>

            <button
              disabled
              title="Order placement coming in Sprint 3"
              className="shrink-0 px-5 py-2 rounded-xl bg-orange-500 text-white
                         text-sm font-bold opacity-50 cursor-not-allowed"
            >
              Place Order
              <span className="block text-xs font-normal opacity-75">(Sprint 3)</span>
            </button>
          </div>

          {/* Per-restaurant breakdown when multiple sources */}
          {deliveryInfo?.breakdown && deliveryInfo.breakdown.length > 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-0.5">
              {deliveryInfo.breakdown.map((b) => (
                <span key={b.name} className="text-xs text-gray-500">
                  {b.name}: ৳{b.fee}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
const NearbyRestaurantsView = ({ userLocation }) => {
  const { lat, lng } = userLocation

  const [expandedId, setExpandedId] = useState(null)
  const [cart, setCart]             = useState([])

  const handleToggle = (id) =>
    setExpandedId(prev => prev === id ? null : id)

  const handleAdd = (restaurantId, item) => {
    const restaurant = allRestaurants.find(r => r.id === restaurantId)
    setCart(prev => {
      const existing = prev.find(c => c.itemId === item.id)
      if (existing) {
        return prev.map(c =>
          c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, {
        restaurantId,
        restaurantGroup: restaurant?.group ?? null,
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      }]
    })
  }

  const handleRemove = (restaurantId, itemId) => {
    setCart(prev =>
      prev
        .map(c => c.itemId === itemId ? { ...c, quantity: c.quantity - 1 } : c)
        .filter(c => c.quantity > 0)
    )
  }

  // Generate + group restaurants — only recalculates when location changes
  const { allRestaurants, clusters, standalone } = useMemo(() => {
    const all = generateRestaurants(lat, lng)
    const byGroup = {}
    all.forEach(r => {
      if (!r.group) return
      if (!byGroup[r.group]) byGroup[r.group] = []
      byGroup[r.group].push(r)
    })
    const validClusters = Object.entries(byGroup)
      .filter(([, rs]) => allPairsWithinRadius(rs, 2))

    return {
      allRestaurants: all,
      clusters: validClusters,
      standalone: all.filter(r => !r.group),
    }
  }, [lat, lng])

  const cartFor = (restaurantId) =>
    cart.filter(c => c.restaurantId === restaurantId)

  const clusterCount  = clusters.reduce((s, [, rs]) => s + rs.length, 0)
  const standardCount = standalone.length

  return (
    <div className="space-y-6 pb-36">

      {/* ── Summary ──────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm
                      px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-bold text-gray-900 text-sm">
            {clusterCount + standardCount} restaurants near this location
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Click a restaurant to browse its menu and add items
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                           px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
            🔗 {clusterCount} in clusters
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                           px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
            🚚 {standardCount} standard
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — CLUSTER DELIVERY
          ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-2 h-7 rounded-full bg-emerald-500" />
          <h2 className="font-black text-gray-900 text-lg">🔗 Cluster Delivery</h2>
        </div>
        <p className="text-xs text-gray-500 ml-[18px] mb-4">
          Restaurants within <strong>2 km</strong> of each other. You can order from
          <em> any one, two, or all</em> — as long as your whole cart stays within the
          same cluster, you get the discounted combined delivery fee.
        </p>

        {clusters.map(([groupId, restaurants]) => {
          let maxIntraKm = 0
          for (let i = 0; i < restaurants.length; i++)
            for (let j = i + 1; j < restaurants.length; j++) {
              const d = haversine(restaurants[i].lat, restaurants[i].lng, restaurants[j].lat, restaurants[j].lng)
              if (d > maxIntraKm) maxIntraKm = d
            }

          const clusterFeePreview = calcFee(restaurants, lat, lng, true)
          const indivFeePreview   = calcFee(restaurants, lat, lng, false)
          const color = CLUSTER_COLORS[groupId] ?? '#059669'

          return (
            <div key={groupId} className="mb-5">
              {/* Cluster header bar */}
              <div
                className="rounded-t-2xl px-4 py-3 flex items-center justify-between"
                style={{ background: color }}
              >
                <div>
                  <p className="font-black text-white text-sm">
                    Cluster {groupId} · {restaurants.length} restaurants
                  </p>
                  <p className="text-xs opacity-80 text-white mt-0.5">
                    All within {(maxIntraKm * 1000).toFixed(0)} m of each other
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white opacity-75">Combined delivery</p>
                  <p className="text-sm font-black text-white">৳{clusterFeePreview.fee}</p>
                  {clusterFeePreview.savings > 0 && (
                    <p className="text-xs text-white opacity-75">
                      Save ৳{clusterFeePreview.savings}
                    </p>
                  )}
                </div>
              </div>

              {/* Restaurant cards */}
              <div
                className="rounded-b-2xl overflow-hidden divide-y"
                style={{
                  border: `2px solid ${color}44`,
                  borderTop: 'none',
                  divideColor: color + '22',
                }}
              >
                {restaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    clusterColor={color}
                    isExpanded={expandedId === r.id}
                    onToggle={() => handleToggle(r.id)}
                    cartItems={cartFor(r.id)}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-4 text-xs text-gray-400 font-semibold
                           uppercase tracking-widest">
            Outside cluster range
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — STANDARD DELIVERY
          ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-2 h-7 rounded-full bg-gray-400" />
          <h2 className="font-black text-gray-900 text-lg">🚚 Standard Delivery</h2>
        </div>
        <p className="text-xs text-gray-500 ml-[18px] mb-4">
          Too far from the clusters for a combined pickup. Ordering from these —
          or mixing with a cluster — applies individual fees per restaurant.
        </p>

        <div className="space-y-3">
          {standalone.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              clusterColor={null}
              isExpanded={expandedId === r.id}
              onToggle={() => handleToggle(r.id)}
              cartItems={cartFor(r.id)}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </section>

      {/* ── Fee explainer ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-4 space-y-2">
        <p className="text-xs font-bold text-blue-800">ℹ️ How delivery fees work</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700">
          <div className="flex items-start gap-2">
            <span className="font-bold shrink-0">🔗</span>
            <span>
              <strong>Same cluster only</strong> — one combined fee, 40% discount on the
              longest pickup distance.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold shrink-0">🚚</span>
            <span>
              <strong>Mixed sources</strong> — individual fee per restaurant added
              together, no discount.
            </span>
          </div>
        </div>
      </div>

      {/* Sticky cart bar */}
      <CartBar
        cartItems={cart}
        allRestaurants={allRestaurants}
        userLat={lat}
        userLng={lng}
        onClear={() => setCart([])}
      />
    </div>
  )
}

export default NearbyRestaurantsView