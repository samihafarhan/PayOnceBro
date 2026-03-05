import { useState, useEffect } from 'react'
import useRestaurantOrders from '../../hooks/useRestaurantOrders'
import OrderCard from '../../components/restaurant/OrderCard'
import { getProfile } from '../../services/restaurantService'

const TABS = [
  { key: 'pending',   label: 'New Orders' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'pickup',    label: 'Ready for Pickup' },
  { key: 'completed', label: 'Completed Today' },
]

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <span className="text-4xl mb-3">🍽️</span>
    <p className="text-sm">{message}</p>
  </div>
)

// ─── Restaurant Info Tab ──────────────────────────────────────────────────────

const RestaurantInfo = () => {
  const [info, setInfo] = useState({ name: '', address: '' })

  useEffect(() => {
    getProfile()
      .then((p) => setInfo({ name: p.name || '', address: p.address || '' }))
      .catch(() => {})
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 px-5 py-3 flex items-center gap-3">
      <span className="text-sm font-semibold text-gray-800">
        {info.name || 'Restaurant'}
      </span>
      {info.address && (
        <span className="text-xs text-gray-400">{info.address}</span>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('pending')
  const { data: orders, loading, error, refresh } = useRestaurantOrders()

  const list = orders?.[activeTab] ?? []

  const pendingCount = orders?.pending?.length ?? 0

  return (
    <div>
      {/* Restaurant info tab */}
      <RestaurantInfo />

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Restaurant Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your incoming orders in real time</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
        {loading && (
          <span className="text-xs text-gray-400 animate-pulse">Refreshing…</span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(({ key, label }) => {
          const count = orders?.[key]?.length ?? 0
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                isActive
                  ? 'text-orange-700 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold ${
                    key === 'pending'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Failed to load orders. <button onClick={refresh} className="underline">Retry</button>
        </div>
      )}

      {/* Order grid */}
      {!loading && !error && list.length === 0 ? (
        <EmptyState
          message={
            activeTab === 'pending'
              ? 'No new orders right now.'
              : 'Nothing here yet.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={refresh} />
          ))}
        </div>
      )}

      {/* Skeleton cards while loading */}
      {loading && !orders && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-gray-200 p-4 h-40 animate-pulse" />
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
