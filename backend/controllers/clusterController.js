// backend/controllers/clusterController.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles all HTTP requests related to clustering.
// Controllers only validate input → call services/models → send response.
// ─────────────────────────────────────────────────────────────────────────────

import * as restaurantModel   from '../models/restaurantModel.js'
import {
  evaluateCluster,
  findClusters,
  getNearbyClusteredRestaurants,
  calculateDeliveryFee,
  estimateDeliveryTime,
} from '../services/clusteringService.js'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cluster/check
//
// Body: { restaurantIds: string[], userLat?: number, userLng?: number }
//
// Used by the cart page — when a user adds items from multiple restaurants,
// the frontend calls this to see if those restaurants qualify for a cluster.
//
// Example response (eligible):
// {
//   eligible: true,
//   centroid: { lat: 23.81, lng: 90.41 },
//   maxDistanceKm: 1.2,
//   deliveryFee: { fee: 38, breakdown: [...], savings: 22 },
//   eta: { estimatedMinutes: 35, breakdown: {...} }
// }
// ─────────────────────────────────────────────────────────────────────────────
export const checkCluster = async (req, res, next) => {
  try {
    const { restaurantIds, userLat, userLng } = req.body

    // Validate input
    if (!Array.isArray(restaurantIds) || restaurantIds.length < 2) {
      return res.status(400).json({ message: 'Provide at least 2 restaurantIds to check a cluster' })
    }

    // Fetch restaurant records from DB (includes lat/lng once data is added)
    const restaurants = await restaurantModel.getByIds(restaurantIds)

    if (restaurants.length < 2) {
      return res.status(404).json({ message: 'Could not find enough restaurants with the given IDs' })
    }

    // Run the cluster eligibility check
    const clusterResult = evaluateCluster(restaurants)

    if (!clusterResult.eligible) {
      // Not eligible — still return fee/eta for individual (non-cluster) delivery
      const lat = parseFloat(userLat)
      const lng = parseFloat(userLng)
      const hasLocation = !isNaN(lat) && !isNaN(lng)

      return res.json({
        eligible: false,
        reason: clusterResult.reason,
        deliveryFee: hasLocation ? calculateDeliveryFee(restaurants, lat, lng, false) : null,
        eta:         hasLocation ? estimateDeliveryTime(restaurants, lat, lng)        : null,
      })
    }

    // Eligible — calculate cluster fee and ETA
    const lat = parseFloat(userLat)
    const lng = parseFloat(userLng)
    const hasLocation = !isNaN(lat) && !isNaN(lng)

    res.json({
      eligible:     true,
      centroid:     clusterResult.centroid,
      maxDistanceKm: clusterResult.maxDistanceKm,
      restaurants:  restaurants.map((r) => ({ id: r.id, name: r.name })),
      deliveryFee:  hasLocation ? calculateDeliveryFee(restaurants, lat, lng, true) : null,
      eta:          hasLocation ? estimateDeliveryTime(restaurants, lat, lng)       : null,
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cluster/nearby?userLat=X&userLng=Y&radius=2
//
// Returns all clusters that exist near the user's location.
// Used by the Search page to show "cluster delivery available" banners
// and by the AI Combo Builder (Sprint 4) to get eligible restaurants.
//
// Example response:
// {
//   clusters: [
//     {
//       restaurants: [ { id, name, lat, lng }, ... ],
//       centroid: { lat, lng },
//       maxDistanceKm: 1.2,
//       distanceToUserKm: 0.8
//     }
//   ],
//   total: 1
// }
// ─────────────────────────────────────────────────────────────────────────────
export const getNearbyClusters = async (req, res, next) => {
  try {
    const { userLat, userLng, radius } = req.query

    const lat = parseFloat(userLat)
    const lng = parseFloat(userLng)

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'userLat and userLng are required query params' })
    }

    const clusterRadiusKm = parseFloat(radius) || parseFloat(process.env.CLUSTER_RADIUS_KM) || 2

    // Get all active restaurants from DB
    const allRestaurants = await restaurantModel.getAllActive()

    // Find all clusters near the user
    const clusters = getNearbyClusteredRestaurants(allRestaurants, lat, lng, clusterRadiusKm)

    res.json({
      clusters: clusters.map((c) => ({
        restaurants:     c.restaurants.map((r) => ({ id: r.id, name: r.name, lat: r.lat, lng: r.lng })),
        centroid:        c.centroid,
        maxDistanceKm:   c.maxDistanceKm,
        distanceToUserKm: parseFloat(c.distanceToUserKm.toFixed(3)),
        restaurantCount: c.restaurants.length,
      })),
      total: clusters.length,
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cluster/fee
//
// Body: { restaurantIds, userLat, userLng, isCluster }
//
// Calculates delivery fee for a given set of restaurants.
// Separated from /check so the cart can recalculate fee independently
// without re-running the eligibility check every time.
// ─────────────────────────────────────────────────────────────────────────────
export const getDeliveryFee = async (req, res, next) => {
  try {
    const { restaurantIds, userLat, userLng, isCluster } = req.body

    if (!Array.isArray(restaurantIds) || restaurantIds.length === 0) {
      return res.status(400).json({ message: 'restaurantIds array is required' })
    }

    const lat = parseFloat(userLat)
    const lng = parseFloat(userLng)

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'userLat and userLng are required' })
    }

    const restaurants = await restaurantModel.getByIds(restaurantIds)
    const result = calculateDeliveryFee(restaurants, lat, lng, Boolean(isCluster))

    res.json(result)
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cluster/eta
//
// Body: { restaurantIds, userLat, userLng }
//
// Estimates delivery time for a set of restaurants.
// ─────────────────────────────────────────────────────────────────────────────
export const getETA = async (req, res, next) => {
  try {
    const { restaurantIds, userLat, userLng } = req.body

    if (!Array.isArray(restaurantIds) || restaurantIds.length === 0) {
      return res.status(400).json({ message: 'restaurantIds array is required' })
    }

    const lat = parseFloat(userLat)
    const lng = parseFloat(userLng)

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'userLat and userLng are required' })
    }

    const restaurants = await restaurantModel.getByIds(restaurantIds)
    const result = estimateDeliveryTime(restaurants, lat, lng)

    res.json(result)
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cluster/all
// Admin / debug only — returns ALL clusters across all active restaurants.
// Useful during development to verify clustering works once location data exists.
// ─────────────────────────────────────────────────────────────────────────────
export const getAllClusters = async (req, res, next) => {
  try {
    const allRestaurants = await restaurantModel.getAllActive()
    const radiusKm = parseFloat(process.env.CLUSTER_RADIUS_KM) || 2

    const clusters = findClusters(allRestaurants, radiusKm)

    res.json({
      radiusKm,
      totalRestaurants: allRestaurants.length,
      totalClusters:    clusters.length,
      clusters: clusters.map((c) => ({
        restaurantCount:  c.restaurants.length,
        restaurants:      c.restaurants.map((r) => ({ id: r.id, name: r.name, lat: r.lat, lng: r.lng })),
        centroid:         c.centroid,
        maxDistanceKm:    c.maxDistanceKm,
      })),
    })
  } catch (err) {
    next(err)
  }
}