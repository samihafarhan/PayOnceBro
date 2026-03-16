// frontend/src/components/user/ClusterBanner.jsx
// Shows green eligible banner or grey standard delivery notice inside Cart.

const ClusterBanner = ({ clusterStatus, checkingCluster }) => {
  if (checkingCluster) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-2 animate-pulse">
        <span className="text-lg">⏳</span>
        <p className="text-sm text-gray-500">Checking cluster eligibility…</p>
      </div>
    )
  }
  if (!clusterStatus.checked) return null

  if (clusterStatus.eligible) {
    const savings = clusterStatus.deliveryFee?.savings ?? 0
    const fee     = clusterStatus.deliveryFee?.fee ?? null
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 flex items-start gap-3">
        <span className="text-2xl mt-0.5">🔗</span>
        <div className="flex-1">
          <p className="font-bold text-emerald-800 text-sm">Cluster Delivery Available!</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            These restaurants are close to each other — one rider picks up all your orders.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {fee !== null && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1">
                🛵 Delivery: ৳{fee.toFixed(0)}
              </span>
            )}
            {savings > 0 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1">
                💰 You save: ৳{savings.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  const fee = clusterStatus.deliveryFee?.fee ?? null
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-start gap-3">
      <span className="text-xl mt-0.5">🚚</span>
      <div>
        <p className="font-semibold text-gray-700 text-sm">Standard Delivery</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {clusterStatus.reason ?? 'Restaurants are too far apart for cluster delivery.'}
        </p>
        {fee !== null && <p className="text-xs text-gray-500 mt-1">Delivery fee: ৳{fee.toFixed(0)}</p>}
      </div>
    </div>
  )
}

export default ClusterBanner