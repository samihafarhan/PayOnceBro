import { useState, useEffect } from 'react'
import useRestaurantOrders from '../../hooks/useRestaurantOrders'
import OrderCard from '../../components/restaurant/OrderCard'
import { getProfile, updateProfile } from '../../services/restaurantService'

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

// ─── Restaurant Profile Panel ─────────────────────────────────────────────────

const ProfilePanel = () => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', cuisine: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    getProfile()
      .then((p) => setForm(p))
      .catch(() => setLoadError('Could not load profile.'))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateProfile(form)
      setForm(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(
        err?.response?.data?.message || err?.message || 'Failed to save profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      {/* Header — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <span className="text-sm font-semibold text-gray-800">
            {form.name || 'Restaurant Profile'}
          </span>
          {form.address && (
            <span className="ml-2 text-xs text-gray-400">{form.address}</span>
          )}
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲ Close' : '✏️ Edit profile'}</span>
      </button>

      {open && (
        <form onSubmit={handleSave} className="px-5 pb-5 border-t border-gray-100 pt-4">
          {loadError && (
            <p className="mb-3 text-xs text-red-600">{loadError}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Restaurant name
              </label>
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Dhaka Bites"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cuisine type
              </label>
              <input
                value={form.cuisine}
                onChange={set('cuisine')}
                placeholder="e.g. Bangladeshi, Asian Fusion"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Address
              </label>
              <input
                value={form.address}
                onChange={set('address')}
                placeholder="e.g. 12 Gulshan Ave, Dhaka"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Contact phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="e.g. +880 1700 000000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {saveError && (
            <p className="mt-3 text-xs text-red-600">{saveError}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
            {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
          </div>
        </form>
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
      {/* Restaurant profile — collapsible */}
      <ProfilePanel />

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
