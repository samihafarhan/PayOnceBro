import { haversineDistance } from '../utils/geoUtils.js'

const BASE_FEE = Number(process.env.BASE_DELIVERY_FEE) || 20
const PER_KM = Number(process.env.PER_KM_RATE) || 10
const DISCOUNT = Number(process.env.CLUSTER_DISCOUNT_RATE) || 0.6

/**
 * Calculates the delivery fee for an order.
 *
 * There are two modes:
 *
 * NON-CLUSTER: Each restaurant is a separate delivery stop, so the user
 * pays a full fee per restaurant. The fees are added together.
 *   Formula per restaurant: BASE_FEE + (distance_km × PER_KM_RATE)
 *
 * CLUSTER: All restaurants are close together, so ONE rider picks up from
 * all of them in a single trip. The user only pays once — based on the
 * farthest restaurant — and gets a discount on top of that.
 *   Formula: BASE_FEE + (max_distance_km × PER_KM_RATE × DISCOUNT_RATE)
 *
 * @param {Array<{id, name, lat, lng}>} restaurants - Restaurants in the order
 * @param {number} userLat  - Customer's latitude
 * @param {number} userLng  - Customer's longitude
 * @param {boolean} isCluster - Whether this is a clustered order
 * @returns {{ fee: number, breakdown: Array, savings: number }}
 */
export const calculate = (restaurants, userLat, userLng, isCluster) => {
  // Calculate each restaurant's distance from the customer
  const distances = restaurants.map((r) => ({
    restaurantId: r.id,
    name: r.name,
    distanceKm: haversineDistance(r.lat, r.lng, userLat, userLng),
  }))

  if (!isCluster) {
    // Standard: each restaurant charged separately
    const breakdown = distances.map((d) => ({
      restaurantId: d.restaurantId,
      name: d.name,
      distanceKm: parseFloat(d.distanceKm.toFixed(2)),
      fee: parseFloat((BASE_FEE + d.distanceKm * PER_KM).toFixed(2)),
    }))
    const fee = parseFloat(breakdown.reduce((sum, b) => sum + b.fee, 0).toFixed(2))
    return { fee, breakdown, savings: 0 }
  }

  // Cluster: one rider, one trip, discount applied
  const maxDist = Math.max(...distances.map((d) => d.distanceKm))
  const clusterFee = parseFloat((BASE_FEE + maxDist * PER_KM * DISCOUNT).toFixed(2))
  const individualTotal = distances.reduce((s, d) => s + BASE_FEE + d.distanceKm * PER_KM, 0)
  const savings = parseFloat((individualTotal - clusterFee).toFixed(2))

  const breakdown = distances.map((d) => ({
    restaurantId: d.restaurantId,
    name: d.name,
    distanceKm: parseFloat(d.distanceKm.toFixed(2)),
  }))

  return { fee: clusterFee, breakdown, savings }
}
