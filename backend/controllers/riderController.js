// backend/controllers/riderController.js
// Request handlers — validate input, call services/models, send responses

import * as riderModel from '../models/riderModel.js'

/**
 * updateLocation — rider sends their current GPS coordinates every 30 seconds.
 * This updates the rider's location in the database.
 *
 * Request:  PUT /api/rider/location
 * Auth:     JWT (rider)
 * Body:     { lat, lng }
 * Response: { success: true, location: { id, current_lat, current_lng } }
 */
export const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body
    const riderId = req.user.id

    // Validate inputs
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'lat and lng must be numbers' })
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Invalid coordinates' })
    }

    // Update in database
    const location = await riderModel.updateLocation(riderId, lat, lng)

    if (!location) {
      return res.status(404).json({ message: 'Rider not found. Please load your profile first.' })
    }

    res.json({
      success: true,
      location,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * getLocation — fetch a rider's current location.
 *
 * Request:  GET /api/rider/:id/location
 * Auth:     JWT
 * Response: { id, current_lat, current_lng }
 */
export const getLocation = async (req, res, next) => {
  try {
    const { id } = req.params

    const location = await riderModel.getLocation(id)

    if (!location) {
      return res.status(404).json({ message: 'Rider not found' })
    }

    res.json(location)
  } catch (error) {
    next(error)
  }
}

/**
 * getProfile — fetch rider's full profile (used on dashboard).
 *
 * Request:  GET /api/rider/profile/me
 * Auth:     JWT (rider)
 * Response: { id, user_id, current_lat, current_lng, is_available, avg_rating, total_deliveries }
 *           OR default profile if rider doesn't exist
 */
export const getProfile = async (req, res, next) => {
  try {
    const riderId = req.user.id

    let rider = await riderModel.getById(riderId)

    // If rider profile doesn't exist, return a default profile
    // The rider record will be created when the user registers OR when their first order is assigned
    if (!rider) {
      console.log(`No rider profile found for user ${riderId}. Returning default profile.`)
      return res.json({
        id: riderId,
        user_id: riderId,
        current_lat: 0,
        current_lng: 0,
        is_available: true,
        avg_rating: 0,
        total_deliveries: 0,
      })
    }

    res.json(rider)
  } catch (error) {
    next(error)
  }
}
