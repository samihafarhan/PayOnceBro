import api from './api'

export const getRestaurantOrders = async () => {
  const { data } = await api.get('/restaurants/orders')
  return data
}

export const updateOrderStatus = async (orderId, status) => {
  const { data } = await api.put(`/restaurants/orders/${orderId}/status`, { status })
  return data
}
