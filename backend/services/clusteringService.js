// backend/services/clusteringService.js
// ─────────────────────────────────────────────────────────────────────────────
// AI-Based Restaurant Clustering Service
//
// Core idea:
//   1. For a set of restaurants, check every pair's distance using Haversine.
//   2. If ALL pairs are within the radius → they form a valid cluster.
//   3. Expose helpers for: checking eligibility, sorting by proximity,
//      and finding ALL possible clusters near a user.
// ─────────────────────────────────────────────────────────────────────────────

import { haversineDistance } from '../utils/geoUtils.js'

// Default cluster radius from .env, fallback to 2 km
const DEFAULT_RADIUS_KM = parseFloat(process.env.CLUSTER_RADIUS_KM) || 2

// ─────────────────────────────────────────────────────────────────────────────
// evaluateCluster
//
// Given a list of restaurant objects (each must have lat + lng),
// checks whether ALL of them are within `radiusKm` of each other.
//
// Why "all pairs"?
//   If A→B = 1.5km and B→C = 1.5km but A→C = 3km, they shouldn't cluster.
//   A single rider picking up from all three would travel too far.
//
// Returns:
//   { eligible: true,  centroid: {lat, lng}, maxDistanceKm: number }
//   { eligible: false, reason: string }
// ─────────────────────────────────────────────────────────────────────────────
export const evaluateCluster = (restaurants, radiusKm = DEFAULT_RADIUS_KM) => {
  // Need at least 2 restaurants to form a cluster
  if (!restaurants || restaurants.length < 2) {
    return { eligible: false, reason: 'Need at least 2 restaurants to form a cluster' }
  }

  // Check every pair
  let maxDistanceKm = 0

  for (let i = 0; i < restaurants.length; i++) {
    for (let j = i + 1; j < restaurants.length; j++) {
      const a = restaurants[i]
      const b = restaurants[j]

      // Skip if either restaurant is missing coordinates
      if (!a.lat || !a.lng || !b.lat || !b.lng) {
        return { eligible: false, reason: `Restaurant "${a.name || a.id}" or "${b.name || b.id}" is missing location data` }
      }

      const dist = haversineDistance(a.lat, a.lng, b.lat, b.lng)

      if (dist > radiusKm) {
        return {
          eligible: false,
          reason: `"${a.name || a.id}" and "${b.name || b.id}" are ${dist.toFixed(2)} km apart (limit: ${radiusKm} km)`,
        }
      }

      if (dist > maxDistanceKm) maxDistanceKm = dist
    }
  }

  // All pairs are within radius — calculate the centroid (geographic center)
  // Centroid = average of all lats and lngs
  const centroid = {
    lat: restaurants.reduce((sum, r) => sum + r.lat, 0) / restaurants.length,
    lng: restaurants.reduce((sum, r) => sum + r.lng, 0) / restaurants.length,
  }

  return { eligible: true, centroid, maxDistanceKm: parseFloat(maxDistanceKm.toFixed(3)) }
}

// ─────────────────────────────────────────────────────────────────────────────
// sortByProximity
//
// Takes a list of items (each with a `.restaurant` that has lat/lng)
// and sorts them: cluster-eligible first, then by distance to user.
//
// Used by the search controller to rank results.
// ─────────────────────────────────────────────────────────────────────────────
export const sortByProximity = (items, userLat, userLng, radiusKm = DEFAULT_RADIUS_KM) => {
  if (!userLat || !userLng) return items // no location → return unsorted

  return items
    .map((item) => {
      const r = item.restaurant
      const distanceKm = (r?.lat && r?.lng)
        ? haversineDistance(userLat, userLng, r.lat, r.lng)
        : null

      return {
        ...item,
        distanceKm,
        isClusterEligible: distanceKm !== null && distanceKm <= radiusKm,
      }
    })
    .sort((a, b) => {
      // Cluster-eligible restaurants always come first
      if (a.isClusterEligible && !b.isClusterEligible) return -1
      if (!a.isClusterEligible && b.isClusterEligible) return 1

      // Within the same group, sort by distance
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm
      }
      return 0
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// findClusters
//
// Given a flat list of restaurants, groups them into valid clusters.
// Uses a simple greedy approach:
//   - For each restaurant, try to form a cluster with every other restaurant
//     within radius. Build the largest valid group possible.
//
// This is intentionally simple for a university project.
// Production systems use graph-based clustering (e.g. DBSCAN).
//
// Returns: array of clusters, each is:
//   { restaurants: [...], centroid: {lat, lng}, maxDistanceKm: number }
// ─────────────────────────────────────────────────────────────────────────────
export const findClusters = (restaurants, radiusKm = DEFAULT_RADIUS_KM) => {
  if (!restaurants || restaurants.length === 0) return []

  const clusters = []
  const assigned = new Set() // track which restaurants are already in a cluster

  for (let i = 0; i < restaurants.length; i++) {
    if (assigned.has(restaurants[i].id)) continue

    const base = restaurants[i]
    if (!base.lat || !base.lng) continue

    // Find all restaurants within radius of the base restaurant
    const nearby = restaurants.filter((r) => {
      if (r.id === base.id) return false
      if (!r.lat || !r.lng) return false
      const dist = haversineDistance(base.lat, base.lng, r.lat, r.lng)
      return dist <= radiusKm
    })

    if (nearby.length === 0) continue // no neighbours → no cluster

    // Try to form a cluster with all nearby restaurants
    // Validate all-pairs constraint
    const candidates = [base, ...nearby]
    const result = evaluateCluster(candidates, radiusKm)

    if (result.eligible) {
      // Full group is valid
      clusters.push({ restaurants: candidates, centroid: result.centroid, maxDistanceKm: result.maxDistanceKm })
      candidates.forEach((r) => assigned.add(r.id))
    } else {
      // Full group fails — try pairs (base + each neighbour individually)
      for (const neighbour of nearby) {
        if (assigned.has(neighbour.id)) continue
        const pairResult = evaluateCluster([base, neighbour], radiusKm)
        if (pairResult.eligible) {
          clusters.push({ restaurants: [base, neighbour], centroid: pairResult.centroid, maxDistanceKm: pairResult.maxDistanceKm })
          assigned.add(base.id)
          assigned.add(neighbour.id)
          break // one cluster per base restaurant (keep it simple)
        }
      }
    }
  }

  return clusters
}

// ─────────────────────────────────────────────────────────────────────────────
// getNearbyClusteredRestaurants
//
// From ALL active restaurants, finds clusters whose centroid is within
// `searchRadiusKm` of the user. Used by the AI Combo Builder (Sprint 4).
//
// @param allRestaurants  - full list of restaurant objects with lat/lng
// @param userLat         - user's latitude
// @param userLng         - user's longitude
// @param clusterRadiusKm - how close restaurants must be to cluster together
// @param searchRadiusKm  - how close a cluster must be to the user (default 5 km)
//
// Returns: array of { restaurants, centroid, maxDistanceKm, distanceToUserKm }
// ─────────────────────────────────────────────────────────────────────────────
export const getNearbyClusteredRestaurants = (
  allRestaurants,
  userLat,
  userLng,
  clusterRadiusKm = DEFAULT_RADIUS_KM,
  searchRadiusKm = 5
) => {
  const allClusters = findClusters(allRestaurants, clusterRadiusKm)

  // Filter to clusters that are actually near the user
  return allClusters
    .map((cluster) => ({
      ...cluster,
      distanceToUserKm: haversineDistance(userLat, userLng, cluster.centroid.lat, cluster.centroid.lng),
    }))
    .filter((cluster) => cluster.distanceToUserKm <= searchRadiusKm)
    .sort((a, b) => a.distanceToUserKm - b.distanceToUserKm)
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateDeliveryFee
//
// Fee formula (from .env):
//   Non-cluster: (BASE_FEE + distance × PER_KM_RATE) per restaurant, summed
//   Cluster:     BASE_FEE + (maxDistance × PER_KM_RATE) × CLUSTER_DISCOUNT_RATE
//
// @param restaurants     - array of restaurant objects with lat/lng
// @param userLat, userLng
// @param isCluster       - boolean
//
// Returns: { fee, breakdown, savings }
// ─────────────────────────────────────────────────────────────────────────────
export const calculateDeliveryFee = (restaurants, userLat, userLng, isCluster) => {
  const BASE_FEE          = parseFloat(process.env.BASE_DELIVERY_FEE)   || 20
  const PER_KM_RATE       = parseFloat(process.env.PER_KM_RATE)         || 10
  const DISCOUNT_RATE     = parseFloat(process.env.CLUSTER_DISCOUNT_RATE) || 0.6

  // Per-restaurant fees (used for both non-cluster total and savings comparison)
  const breakdown = restaurants.map((r) => {
    const distKm = (r.lat && r.lng && userLat && userLng)
      ? haversineDistance(userLat, userLng, r.lat, r.lng)
      : 0
    const fee = BASE_FEE + distKm * PER_KM_RATE
    return { restaurantId: r.id, restaurantName: r.name, distanceKm: parseFloat(distKm.toFixed(2)), fee: parseFloat(fee.toFixed(2)) }
  })

  const normalTotal = breakdown.reduce((sum, b) => sum + b.fee, 0)

  if (!isCluster) {
    return { fee: parseFloat(normalTotal.toFixed(2)), breakdown, savings: 0 }
  }

  // Cluster fee: based on the farthest restaurant from user
  const maxDist = Math.max(...breakdown.map((b) => b.distanceKm))
  const clusterFee = parseFloat(((BASE_FEE + maxDist * PER_KM_RATE) * DISCOUNT_RATE).toFixed(2))
  const savings    = parseFloat((normalTotal - clusterFee).toFixed(2))

  return { fee: clusterFee, breakdown, savings }
}

// ─────────────────────────────────────────────────────────────────────────────
// estimateDeliveryTime
//
// ETA formula:
//   maxPrepTime  = slowest restaurant's avg_prep_time
//   travelTime   = (totalRouteDistance / RIDER_SPEED_KMH) × 60   (minutes)
//   estimatedMin = maxPrepTime + travelTime + 5  (buffer)
//
// @param restaurants - array with avg_prep_time, lat, lng
// @param userLat, userLng
//
// Returns: { estimatedMinutes, breakdown }
// ─────────────────────────────────────────────────────────────────────────────
export const estimateDeliveryTime = (restaurants, userLat, userLng) => {
  const RIDER_SPEED_KMH = parseFloat(process.env.RIDER_SPEED_KMH) || 30

  const maxPrepTime = Math.max(...restaurants.map((r) => r.avg_prep_time || 20))

  // Simple total distance: sum of (user→each restaurant) distances
  // In Sprint 3, this will use the optimized route from routeService
  const totalDistanceKm = restaurants.reduce((sum, r) => {
    if (!r.lat || !r.lng || !userLat || !userLng) return sum
    return sum + haversineDistance(userLat, userLng, r.lat, r.lng)
  }, 0)

  const travelTimeMin  = (totalDistanceKm / RIDER_SPEED_KMH) * 60
  const estimatedMinutes = Math.ceil(maxPrepTime + travelTimeMin + 5)

  return {
    estimatedMinutes,
    breakdown: {
      maxPrepTimeMin: maxPrepTime,
      travelTimeMin:  parseFloat(travelTimeMin.toFixed(1)),
      bufferMin:      5,
      totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
    },
  }
}