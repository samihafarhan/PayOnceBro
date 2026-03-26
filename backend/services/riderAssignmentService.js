import * as riderModel from '../models/riderModel.js'
import * as orderModel from '../models/orderModel.js'
import * as restaurantModel from '../models/restaurantModel.js'
import * as clusterModel from '../models/clusterModel.js'
import { haversineDistance } from '../utils/geoUtils.js'

const getCentroid = (restaurants = []) => {
  const valid = restaurants.filter((r) => r.lat != null && r.lng != null)
  if (valid.length === 0) return null
  return {
    lat: valid.reduce((s, r) => s + r.lat, 0) / valid.length,
    lng: valid.reduce((s, r) => s + r.lng, 0) / valid.length,
  }
}

export const findBestRider = async (orderId) => {
  const order = await orderModel.getById(orderId)
  if (!order) return null

  const restaurantIds = await orderModel.getRestaurantIds(orderId)
  const restaurants = await restaurantModel.getByIds(restaurantIds)
  const centroid = getCentroid(restaurants)
  if (!centroid) return null

  const availableRiders = await riderModel.getAvailable()
  const candidates = availableRiders
    .filter((r) => r.current_lat != null && r.current_lng != null)
    .map((r) => ({
      rider: r,
      distanceKm: haversineDistance(centroid.lat, centroid.lng, r.current_lat, r.current_lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)

  if (candidates.length === 0) return null

  const chosen = candidates[0].rider

  await orderModel.updateRider(order.id, chosen.id)
  if (order.cluster_id) {
    await clusterModel.assignRider(order.cluster_id, chosen.id)
  }
  await riderModel.setAvailable(chosen.id, false)

  return {
    riderId: chosen.id,
    distanceKm: Number(candidates[0].distanceKm.toFixed(3)),
  }
}
