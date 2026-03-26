// frontend/src/components/rider/AssignmentCard.jsx
// Individual order card showing assignment details with status update button

import StatusButtons from './StatusButtons.jsx'

/**
 * AssignmentCard — Displays a single order assignment with:
 * - Restaurant and customer details
 * - Order items summary
 * - Current status
 * - Status update button
 * 
 * Props:
 *   - order: Order object { id, status, items[], restaurant, customer, ... }
 *   - onStatusUpdate: Callback fired after successful status update
 */
const AssignmentCard = ({ order, onStatusUpdate }) => {
  const restaurantName = order.restaurant?.name || 'Unknown Restaurant'
  const customerName = order.customer?.name || 'Customer'
  const itemCount = order.items?.length || 0
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div
      style={{
        padding: '16px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '16px',
      }}
    >
      {/* Order Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
            Order <span style={{ fontWeight: 'bold' }}>{order.id.slice(0, 8).toUpperCase()}</span>
          </p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0 0 0' }}>
            {restaurantName} → {customerName}
          </p>
        </div>
        <div
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor:
              order.status === 'delivered'
                ? '#dcfce7'
                : order.status === 'on_the_way'
                  ? '#dbeafe'
                  : '#fef3c7',
            color:
              order.status === 'delivered'
                ? '#166534'
                : order.status === 'on_the_way'
                  ? '#1e40af'
                  : '#92400e',
          }}
        >
          {order.status.replace(/_/g, ' ').toUpperCase()}
        </div>
      </div>

      {/* Order Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>ITEMS</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0' }}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
            {itemCount > 1 && ` (${itemCount} type)`}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>TOTAL PRICE</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0' }}>
            ${(order.total_price || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Items List Summary */}
      {order.items && order.items.length > 0 && (
        <div style={{ marginBottom: '12px', maxHeight: '100px', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px' }}>
            {order.items.map((item, idx) => (
              <li key={idx} style={{ padding: '4px 0', color: '#666' }}>
                <span style={{ fontWeight: 'bold' }}>{item.quantity}×</span>{' '}
                {item.name || 'Unknown Item'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status Update Button */}
      <StatusButtons
        orderId={order.id}
        currentStatus={order.status}
        onStatusUpdate={onStatusUpdate}
      />
    </div>
  )
}

export default AssignmentCard
