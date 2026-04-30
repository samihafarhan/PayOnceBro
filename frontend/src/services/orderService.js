import api from './api'

export const placeOrder = async ({ items, restaurantIds, userLat, userLng, isCluster }) => {
  const { data } = await api.post('/orders', {
    items,
    restaurantIds,
    userLat,
    userLng,
    isCluster,
  })
  return data
}

export const getMyOrders = async () => {
  const { data } = await api.get('/orders/my')
  return data
}
