// frontend/src/components/user/OrderProgressBar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Visual horizontal progress bar showing the 5 happy-path order states:
//   pending → accepted → preparing → pickup → on_the_way → delivered
//
// Cancelled orders get a single red "Cancelled" bar instead.
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'pending',    label: 'Placed',     emoji: '📝' },
  { key: 'accepted',   label: 'Accepted',   emoji: '✅' },
  { key: 'preparing',  label: 'Preparing',  emoji: '👨‍🍳' },
  { key: 'pickup',     label: 'Picked up',  emoji: '📦' },
  { key: 'on_the_way', label: 'On the way', emoji: '🛵' },
  { key: 'delivered',  label: 'Delivered',  emoji: '🎉' },
]

const OrderProgressBar = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">❌</span>
        <p className="text-sm font-bold text-red-700">Order cancelled</p>
      </div>
    )
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status)
  const safeIndex = currentIndex === -1 ? 0 : currentIndex

  return (
    <div className="w-full">
      {/* Dots + connector lines */}
      <div className="flex items-center justify-between w-full">
        {STEPS.map((step, i) => {
          const isComplete = i < safeIndex
          const isCurrent = i === safeIndex
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-colors
                    ${
                      isComplete
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                          ? 'bg-orange-500 text-white ring-4 ring-orange-100 animate-pulse'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                >
                  {isComplete ? '✓' : step.emoji}
                </div>
                <span
                  className={`mt-1 text-[10px] font-semibold text-center w-14 leading-tight
                    ${
                      isComplete
                        ? 'text-emerald-600'
                        : isCurrent
                          ? 'text-orange-600'
                          : 'text-gray-400'
                    }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (skip after last) */}
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 mb-5 transition-colors
                    ${i < safeIndex ? 'bg-emerald-500' : 'bg-gray-200'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OrderProgressBar
