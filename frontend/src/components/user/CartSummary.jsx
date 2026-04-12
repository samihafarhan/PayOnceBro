// frontend/src/components/user/CartSummary.jsx
const CartSummary = ({ subtotal, clusterStatus, onPlaceOrder, placingOrder }) => {
  const fee     = clusterStatus?.deliveryFee?.fee     ?? null
  const savings = clusterStatus?.deliveryFee?.savings ?? 0
  const eta     = clusterStatus?.eta?.estimatedMinutes ?? null
  const total   = subtotal + (fee ?? 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <h3 className="font-bold text-gray-800 text-base">Order Summary</h3>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium text-gray-800">৳{subtotal.toFixed(0)}</span>
        </div>
        {fee !== null ? (
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              Delivery
              {clusterStatus?.eligible && <span className="text-xs text-emerald-600 font-semibold">(cluster)</span>}
            </span>
            <span className="font-medium text-gray-800">৳{fee.toFixed(0)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-gray-400">
            <span>Delivery</span>
            <span className="text-xs italic">share location for fee</span>
          </div>
        )}
        {savings > 0 && (
          <div className="flex justify-between text-emerald-600 font-semibold">
            <span>🎉 Cluster savings</span>
            <span>−৳{savings.toFixed(0)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3 flex justify-between">
        <span className="font-bold text-gray-900">Total</span>
        <span className="font-black text-gray-900 text-lg">
          ৳{total.toFixed(0)}
          {fee === null && <span className="text-xs text-gray-400 font-normal ml-1">+ delivery</span>}
        </span>
      </div>

      {eta && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span>⏱</span>
          <span>Estimated delivery: <strong>{eta} min</strong></span>
        </p>
      )}

      {clusterStatus?.eligible && clusterStatus?.deliveryFee?.breakdown?.length > 1 && (
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer select-none hover:text-gray-600">See fee breakdown</summary>
          <ul className="mt-1.5 space-y-1 pl-2">
            {clusterStatus.deliveryFee.breakdown.map((b) => (
              <li key={b.restaurantId} className="flex justify-between">
                <span className="truncate max-w-40">{b.name ?? b.restaurantId} ({b.distanceKm} km)</span>
                <span>৳{b.fee?.toFixed(0) ?? '—'}</span>
              </li>
            ))}
            <li className="flex justify-between text-emerald-500 font-semibold">
              <span>Cluster fee</span>
              <span>৳{clusterStatus.deliveryFee.fee.toFixed(0)}</span>
            </li>
          </ul>
        </details>
      )}

      <button
        onClick={onPlaceOrder}
        disabled={placingOrder}
        className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm shadow-orange-200 active:scale-95"
      >
        {placingOrder ? 'Placing Order…' : 'Place Order 🛵'}
      </button>
    </div>
  )
}

export default CartSummary