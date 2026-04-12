import { useEffect, useState } from 'react'
import ReviewList from '../../components/restaurant/ReviewList'
import { addRestaurantReviewResponse, getRestaurantReviews } from '../../services/restaurantService'
import { toast } from 'sonner'

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [respondingId, setRespondingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getRestaurantReviews()
      setReviews(data.reviews ?? [])
      setRestaurant(data.restaurant ?? null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!error) return
    toast.error(error, { id: `error-${error}` })
  }, [error])

  const handleRespond = async (ratingId, responseText) => {
    setRespondingId(ratingId)
    setError('')
    try {
      await addRestaurantReviewResponse(ratingId, responseText)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to post response')
    } finally {
      setRespondingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Read customer feedback and respond as the restaurant owner.</p>
      </div>

      {restaurant && (
        <div className="mb-4 bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
          <span className="font-semibold">{restaurant.name}</span>
          <span className="ml-3 text-amber-600 font-semibold">⭐ {Number(restaurant.avg_rating || 0).toFixed(2)}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-gray-200 p-4 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <ReviewList
          reviews={reviews}
          respondingId={respondingId}
          onRespond={handleRespond}
        />
      )}
    </div>
  )
}

export default Reviews
