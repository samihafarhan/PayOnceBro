import api from './api'

export const checkCluster = async ({ restaurantIds, userLat, userLng }) => {
  const { data } = await api.post('/cluster/check', {
    restaurantIds,
    userLat,
    userLng,
  })
  return data
}

export const getDeliveryFee = async ({ restaurantIds, userLat, userLng, isCluster }) => {
  const { data } = await api.post('/delivery/fee', {
    restaurantIds,
    userLat,
    userLng,
    isCluster,
  })
  return data
}

export const getETA = async ({ restaurantIds, userLat, userLng }) => {
  const { data } = await api.post('/cluster/eta', {
    restaurantIds,
    userLat,
    userLng,
  })
  return data
}
