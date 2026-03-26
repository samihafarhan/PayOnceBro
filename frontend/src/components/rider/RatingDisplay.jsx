// frontend/src/components/rider/RatingDisplay.jsx
// Display rider's current average rating and review count

/**
 * RatingDisplay — Shows rider's current average rating with star display.
 * 
 * Props:
 *   - rating: number (0-5)
 *   - reviewCount: number
 *   - size: 'small' | 'medium' | 'large' (default: 'medium')
 */
const RatingDisplay = ({ rating = 0, reviewCount = 0, size = 'medium' }) => {
  const sizes = {
    small: { container: '12px', text: '14px', stars: '16px' },
    medium: { container: '14px', text: '18px', stars: '20px' },
    large: { container: '16px', text: '24px', stars: '28px' },
  }

  const s = sizes[size]
  const stars = Math.round(rating)
  const emptyStars = 5 - stars

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {/* Filled Stars */}
        {Array.from({ length: stars }).map((_, i) => (
          <span key={`filled-${i}`} style={{ fontSize: s.stars, color: '#fbbf24' }}>
            ★
          </span>
        ))}
        {/* Empty Stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} style={{ fontSize: s.stars, color: '#d1d5db' }}>
            ★
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontSize: s.text, fontWeight: 'bold', color: '#1f2937' }}>
          {rating.toFixed(1)}
        </p>
        {reviewCount > 0 && (
          <p style={{ margin: 0, fontSize: s.container, color: '#6b7280' }}>
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        )}
      </div>
    </div>
  )
}

export default RatingDisplay
