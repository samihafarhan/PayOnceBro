import { useState, useEffect } from 'react'
import StatusButtons from '../../components/rider/StatusButtons.jsx'
import api from '../../services/api.js'

const Dashboard = () => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [riderProfile, setRiderProfile] = useState(null)

  // Fetch rider profile and assignments on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rider profile — this is critical
        const { data: profile } = await api.get('/rider/profile/me')
        setRiderProfile(profile)
        setError(null)

        // Fetch assigned orders (when Member D builds this endpoint)
        // For now, we'll show a placeholder
        setAssignments([])
      } catch (err) {
        console.error('Failed to fetch rider profile:', err)
        // Still try to show something even if profile fetch fails
        setError(err.response?.data?.message || 'Failed to load rider profile. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStatusUpdate = (updatedOrder) => {
    // Refresh assignments after status update
    // This will be more sophisticated when Member D builds proper order fetching
    console.log('Order status updated:', updatedOrder)
    setAssignments(prev =>
      prev.map(a => (a.id === updatedOrder.id ? updatedOrder : a))
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Rider Dashboard</h1>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '15px',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: '20px',
          color: '#7f1d1d',
          fontSize: '14px'
        }}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {/* Rider Profile Summary */}
      {riderProfile ? (
        <div style={{
          padding: '20px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#666' }}>Avg Rating</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {riderProfile.avg_rating?.toFixed(1) || '0.0'} ⭐
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666' }}>Total Deliveries</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {riderProfile.total_deliveries || 0}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666' }}>Status</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: riderProfile.is_available ? 'green' : 'orange' }}>
                {riderProfile.is_available ? '● Available' : '● On Delivery'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px',
          background: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#666',
          fontSize: '14px'
        }}>
          Loading your profile...
        </div>
      )}

      {/* Active Assignments */}
      <div style={{
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3>Current Assignments</h3>
        
        {error && (
          <div style={{
            padding: '12px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            marginBottom: '15px',
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}

        {assignments.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No active assignments. You'll receive new deliveries when they're available.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {assignments.map(order => (
              <div
                key={order.id}
                style={{
                  padding: '15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#fafafa'
                }}
              >
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Order ID: <span style={{ fontWeight: 'bold' }}>{order.id.slice(0, 8)}</span>
                  </p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Status: <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                      {order.status}
                    </span>
                  </p>
                </div>

                {/* Status Update Buttons */}
                <StatusButtons
                  orderId={order.id}
                  currentStatus={order.status}
                  onStatusUpdate={handleStatusUpdate}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Earnings Placeholder */}
      <div style={{
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Today's Performance</h3>
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Earnings</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>$0.00</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Deliveries</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard