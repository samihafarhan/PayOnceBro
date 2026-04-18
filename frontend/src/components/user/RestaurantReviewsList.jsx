// frontend/src/components/user/RestaurantReviewsList.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Read-only reviews list shown on the user-facing RestaurantProfile page.
// Consumes Member 3's already-public endpoint GET /api/ratings/restaurant/:id
// (we don't touch their controller or routes).
// ─────────────────────────────────────────────────────────────────────────────

const Stars = ({ score = 0, size = 'sm' }) => {
  const rounded = Math.round(Number(score) || 0)
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-amber-500 ${
        size === 'lg' ? 'text-lg' : 'text-sm'
      }`}
      aria-label={`${rounded} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? '' : 'text-gray-200'}>
          ★
        </span>
      ))}
    </span>
  )
}

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const RestaurantReviewsList = ({ reviews = [], loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!reviews.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <span className="text-3xl">💬</span>
        <p className="text-sm text-gray-500 mt-2">No reviews yet. Be the first to order!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {(r.reviewer_name || 'C')[0].toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {r.reviewer_name || 'Customer'}
              </p>
            </div>
            <Stars score={r.score} />
          </div>

          {r.review_text && (
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{r.review_text}</p>
          )}

          {(r.created_at || r.updated_at) && (
            <p className="text-xs text-gray-400 mt-2">
              {formatDate(r.created_at || r.updated_at)}
            </p>
          )}

          {r.restaurant_response && (
            <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
              <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wide">
                Restaurant response
              </p>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                {r.restaurant_response}
              </p>
              {r.response_at && (
                <p className="text-xs text-gray-400 mt-1">{formatDate(r.response_at)}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default RestaurantReviewsList
