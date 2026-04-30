import ReviewResponseForm from './ReviewResponseForm'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'

const renderStars = (score) => '★'.repeat(score) + '☆'.repeat(5 - score)

const ReviewList = ({ reviews, respondingId, onRespond }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          No reviews yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{review.reviewer_name || 'Customer'}</p>
              <p className="text-xs text-muted-foreground">
                {review.created_at ? new Date(review.created_at).toLocaleString() : 'Unknown date'}
              </p>
            </div>
            <p className="text-sm font-semibold text-amber-600" title={`${review.score}/5`}>
              {renderStars(Number(review.score) || 0)}
            </p>
          </div>

          {review.review_text ? (
            <p className="mt-2 text-sm text-gray-700">{review.review_text}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-400 italic">No written comment.</p>
          )}

          {review.restaurant_response ? (
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
              <Badge variant="outline" className="border-orange-300 text-orange-700">Your response</Badge>
              <p className="text-sm text-orange-900 mt-1">{review.restaurant_response}</p>
            </div>
          ) : (
            <ReviewResponseForm
              saving={respondingId === review.id}
              onSubmit={(responseText) => onRespond(review.id, responseText)}
            />
          )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default ReviewList
