import * as menuModel from '../models/menuModel.js'

/**
 * Haversine distance formula — calculates distance between two GPS points.
 *
 * Imagine the Earth is a big ball. Two restaurants are dots on that ball.
 * This formula tells us how many kilometres apart those dots are.
 *
 * @returns distance in kilometres
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

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

      if (hasLocation && restaurant?.lat && restaurant?.lng) {
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

    // Step 4: Sort results — cluster-eligible restaurants first, then by distance
    enriched.sort((a, b) => {
      // Cluster-eligible first (they get the discount badge!)
      if (a.isClusterEligible && !b.isClusterEligible) return -1
      if (!a.isClusterEligible && b.isClusterEligible) return 1

      // Then sort by distance (closest first)
      if (hasLocation) {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm
        }
      }

      // Default: sort by price
      return a.menuItem.price - b.menuItem.price
    })

    res.json({ results: enriched, total: enriched.length })
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