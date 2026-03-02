import PrepTimer from './PrepTimer'
import OrderActionButtons from './OrderActionButtons'

const STATUS_BADGE = {
  pending:   'bg-yellow-100 text-yellow-700',
  accepted:  'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  pickup:    'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const fmt = (n) => `৳${Number(n).toFixed(0)}`

const OrderCard = ({ order, onStatusChange }) => {
  const isAccepted = order.status === 'accepted'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400 font-mono">
            #{order.id.slice(-8).toUpperCase()}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Cluster badge */}
          {order.isClusteredOrder && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              🔗 Cluster ×{order.cluster?.restaurantCount ?? '?'}
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Items list */}
      <ul className="space-y-1">
        {order.myItems.map((item) => (
          <li key={item.id} className="flex justify-between text-sm text-gray-700">
            <span>
              <span className="font-medium">{item.quantity}×</span>{' '}
              {item.menu_items?.name ?? 'Item'}
            </span>
            <span className="text-gray-500">{fmt(item.price_at_order * item.quantity)}</span>
          </li>
        ))}
      </ul>

      {/* Footer: total + prep timer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-sm font-semibold text-gray-800">
          {fmt(order.total_price)}
        </span>

        {/* Prep timer only shows once order is accepted */}
        {isAccepted && (
          <PrepTimer prepTimeMinutes={order.restaurantPrepTime} />
        )}
      </div>

      {/* Cluster details */}
      {order.isClusteredOrder && order.cluster && (
        <div className="text-xs text-indigo-600 bg-indigo-50 rounded-md px-3 py-1.5">
          Grouped delivery across <strong>{order.cluster.restaurantCount}</strong> restaurant
          {order.cluster.restaurantCount !== 1 ? 's' : ''} — lower delivery fee for customer.
        </div>
      )}

      {/* Action buttons */}
      <OrderActionButtons order={order} onStatusChange={onStatusChange} />
    </div>
  )
}

export default OrderCard
