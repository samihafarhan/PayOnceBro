import supabase from '../config/db.js'
import * as deliveryFeeService from '../services/deliveryFeeService.js'

/**
 * POST /api/delivery/fee
 *
 * Calculates the delivery fee for a set of restaurants and a user location.
 *
 * How it works:
 * 1. Receive the restaurant IDs, user coordinates, and whether it's a cluster order
 * 2. Look up each restaurant to get their lat/lng from the database
 * 3. Pass that data to the fee service which does the math
 * 4. Return the final fee, a per-restaurant breakdown, and the cluster savings
 *
 * Body: { restaurantIds: string[], userLat: number, userLng: number, isCluster: boolean }
 */
export const calculateFee = async (req, res, next) => {
  try {
    const { restaurantIds, userLat, userLng, isCluster = false } = req.body

    if (!Array.isArray(restaurantIds) || restaurantIds.length === 0) {
      return res.status(400).json({ message: 'restaurantIds must be a non-empty array' })
    }
    if (userLat == null || userLng == null) {
      return res.status(400).json({ message: 'userLat and userLng are required' })
    }

    // Fetch the restaurants from the DB to get their coordinates
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id, name, lat, lng')
      .in('id', restaurantIds)

    if (error) throw error

    if (!restaurants || restaurants.length === 0) {
      return res.status(404).json({ message: 'No restaurants found for the given IDs' })
    }

    // Any restaurant missing coordinates cannot be used for fee calculation
    const missing = restaurants.filter((r) => r.lat == null || r.lng == null)
    if (missing.length > 0) {
      return res.status(422).json({
        message: 'Some restaurants are missing location data',
        missing: missing.map((r) => r.id),
      })
    }

    const result = deliveryFeeService.calculate(
      restaurants,
      parseFloat(userLat),
      parseFloat(userLng),
      Boolean(isCluster)
    )

    res.json(result)
  } catch (err) {
    next(err)
  }
}
