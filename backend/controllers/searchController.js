import * as menuModel from '../models/menuModel.js'
import { sortByProximity } from '../services/clusteringService.js'
import { haversineDistance } from '../utils/geoUtils.js'

/**
 * GET /api/search
 * Query params: q, minPrice, maxPrice, cuisine, userLat, userLng
 *
 * This is the "search controller". Think of it as the middleman:
 * 1. It receives the user's search request
 * 2. It asks the menuModel to find matching food
 * 3. It sorts results by proximity (nearby restaurants first)
 * 4. It sends the results back to the frontend
 */
export const search = async (req, res, next) => {
  try {
    const { q = '', minPrice, maxPrice, cuisine, userLat, userLng } = req.query

    // Step 1: Get matching food items from the database
    const items = await menuModel.searchItems(q, { minPrice, maxPrice, cuisine })

    // Step 2: Add distance info if user's location was provided
    const userLatNum = parseFloat(userLat)
    const userLngNum = parseFloat(userLng)
    const hasLocation = !isNaN(userLatNum) && !isNaN(userLngNum)

    // Step 3: Enrich each item with distance and cluster eligibility
    const CLUSTER_RADIUS_KM = parseFloat(process.env.CLUSTER_RADIUS_KM) || 2

    const enriched = items.map((item) => {
      const restaurant = item.restaurants
      let distanceKm = null
      let isClusterEligible = false

      if (hasLocation && restaurant?.lat != null && restaurant?.lng != null) {
        distanceKm = haversineDistance(
          userLatNum,
          userLngNum,
          restaurant.lat,
          restaurant.lng
        )
        // "Cluster eligible" means the restaurant is close enough that
        // ordering from it together with another nearby restaurant gives
        // the customer a discount on delivery fee!
        isClusterEligible = distanceKm <= CLUSTER_RADIUS_KM
      }

      return {
        menuItem: {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          aiTags: item.ai_tags ?? [],
          restaurantId: item.restaurant_id,
        },
        restaurant: {
          id: restaurant?.id,
          name: restaurant?.name,
          address: restaurant?.address,
          lat: restaurant?.lat,
          lng: restaurant?.lng,
          avgRating: restaurant?.avg_rating,
          avgPrepTime: restaurant?.avg_prep_time,
        },
        distanceKm,
        isClusterEligible,
      }
    })

    // Step 4: Sort via clustering service to keep ordering logic centralized.
    const sorted = hasLocation
      ? sortByProximity(enriched, userLatNum, userLngNum)
      : [...enriched].sort((a, b) => a.menuItem.price - b.menuItem.price)

    res.json({ results: sorted, total: sorted.length })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/search/categories
 * Returns all available food categories for the filter dropdown.
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await menuModel.getCategories()
    res.json({ categories })
  } catch (err) {
    next(err)
  }
}
