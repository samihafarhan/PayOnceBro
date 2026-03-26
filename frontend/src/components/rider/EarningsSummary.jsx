// frontend/src/components/rider/EarningsSummary.jsx
// Summary of rider's earnings for today and stats

/**
 * EarningsSummary — Displays earnings metrics and performance stats.
 * 
 * Props:
 *   - earnings: { today: number, total: number, ... }
 *   - deliveries: { today: number, total: number, ... }
 *   - rating: number (average rating)
 *   - isLoading: boolean
 */
const EarningsSummary = ({
  earnings = { today: 0, total: 0 },
  deliveries = { today: 0, total: 0 },
  rating = 0,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              padding: '16px',
              background: '#f5f5f5',
              borderRadius: '8px',
              height: '100px',
              animation: 'pulse 2s infinite',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
      {/* Today's Earnings */}
      <div
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Today's Earnings</p>
        <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
          ${earnings.today.toFixed(2)}
        </p>
      </div>

      {/* Today's Deliveries */}
      <div
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Today's Deliveries</p>
        <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
          {deliveries.today}
        </p>
      </div>

      {/* Avg Rating */}
      <div
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Average Rating</p>
        <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
          {rating.toFixed(1)} ⭐
        </p>
      </div>
    </div>
  )
}

export default EarningsSummary
