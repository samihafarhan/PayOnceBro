import { useEffect, useState } from 'react'
import { getMyOrders } from '../../services/orderService'
import { toast } from 'sonner'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getMyOrders()
        setOrders(Array.isArray(data) ? data : [])
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load your orders.')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading orders...</div>
  }

  if (orders.length === 0) {
    return <div className="p-6 text-sm text-gray-500">No orders yet.</div>
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Order {order.id.slice(0, 8)}</p>
            <span className="text-xs rounded-full bg-gray-100 px-2 py-1 text-gray-600">
              {String(order.status || '').replaceAll('_', ' ')}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p>Total: ৳{Number(order.total_price || 0).toFixed(0)}</p>
            <p>Delivery fee: ৳{Number(order.delivery_fee || 0).toFixed(0)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Orders
