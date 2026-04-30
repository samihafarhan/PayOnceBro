import { useEffect, useState } from 'react'
import ReviewList from '../../components/restaurant/ReviewList'
import { addRestaurantReviewResponse, getRestaurantReviews } from '../../services/restaurantService'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'

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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl">Reviews</CardTitle>
          <CardDescription>Read customer feedback and respond as the restaurant owner.</CardDescription>
        </CardHeader>
      </Card>

      {restaurant && (
        <Card className="mb-4">
          <CardContent className="py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{restaurant.name}</span>
            <Badge className="ml-3" variant="secondary">⭐ {Number(restaurant.avg_rating || 0).toFixed(2)}</Badge>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n}>
              <CardContent>
                <Skeleton className="h-24 w-full rounded-md" />
              </CardContent>
            </Card>
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
