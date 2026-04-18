// frontend/src/components/user/OrderStatusTimeline.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A vertical timeline showing every status transition this order has gone
// through, with the time each step happened.
//
// Reads rows from the `order_status_history` table via the tracking endpoint.
// Falls back to a simple "order placed" card if no history is available yet.
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META = {
  pending:     { label: 'Order placed',         emoji: '📝', color: 'text-gray-700' },
  accepted:    { label: 'Restaurant accepted',  emoji: '✅', color: 'text-emerald-700' },
  preparing:   { label: 'Food being prepared',  emoji: '👨‍🍳', color: 'text-orange-700' },
  pickup:      { label: 'Rider picked up food', emoji: '📦', color: 'text-blue-700' },
  on_the_way:  { label: 'On the way to you',    emoji: '🛵', color: 'text-blue-700' },
  delivered:   { label: 'Delivered',            emoji: '🎉', color: 'text-emerald-700' },
  cancelled:   { label: 'Cancelled',            emoji: '❌', color: 'text-red-700' },
}

const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
  })
}

// Pick whichever timestamp column the DB uses
const pickTimestamp = (row) =>
  row.created_at || row.changed_at || row.timestamp || row.inserted_at || null

const OrderStatusTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        No timeline events yet. Updates will appear here as your order progresses.
      </div>
    )
  }

  // Sort ascending by timestamp in case the API didn't
  const sorted = [...history].sort((a, b) => {
    const ta = new Date(pickTimestamp(a) || 0).getTime()
    const tb = new Date(pickTimestamp(b) || 0).getTime()
    return ta - tb
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 text-sm mb-4">Order timeline</h3>

      <ol className="relative border-l-2 border-gray-100 ml-2 space-y-4">
        {sorted.map((row, i) => {
          const meta = STATUS_META[row.status] || {
            label: row.status,
            emoji: '•',
            color: 'text-gray-700',
          }
          const isLast = i === sorted.length - 1
          return (
            <li key={row.id ?? `${row.status}-${i}`} className="ml-4">
              <span
                className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full text-sm
                  ${isLast ? 'bg-orange-100 ring-4 ring-orange-50' : 'bg-gray-100'}`}
              >
                {meta.emoji}
              </span>
              <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatTime(pickTimestamp(row))}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default OrderStatusTimeline
