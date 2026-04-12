// backend/controllers/riderController.js
// Request handlers — validate input, call services/models, send responses

import * as riderModel from '../models/riderModel.js'
import * as orderModel from '../models/orderModel.js'

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
    const userId = req.user.id

    // Validate inputs
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'lat and lng must be numbers' })
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Invalid coordinates' })
    }

    // Update in database
    const location = await riderModel.updateLocationByUserId(userId, lat, lng)

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
    const userId = req.user.id

    let rider = await riderModel.getByUserId(userId)

    // If rider profile doesn't exist, return a default profile
    // The rider record will be created when the user registers OR when their first order is assigned
    if (!rider) {
      console.log(`No rider profile found for user ${userId}. Returning default profile.`)
      return res.json({
        id: null,
        user_id: userId,
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

/**
 * getAssignments — fetch active assignments for logged-in rider.
 *
 * Request:  GET /api/rider/assignments
 * Auth:     JWT (rider)
 */
export const getAssignments = async (req, res, next) => {
  try {
    const rider = await riderModel.getByUserId(req.user.id)
    if (!rider) return res.json({ assignments: [] })

    const activeStatuses = ['accepted', 'preparing', 'pickup', 'on_the_way']
    const orders = await orderModel.getByRider(rider.id, activeStatuses)
    if (orders.length === 0) return res.json({ assignments: [] })

    const orderIds = orders.map((o) => o.id)
    const items = await orderModel.getItemsForOrders(orderIds)

    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = []
      acc[item.order_id].push(item)
      return acc
    }, {})

    const assignments = orders.map((order) => {
      const orderItems = itemsByOrder[order.id] ?? []
      const restaurantsById = {}
      orderItems.forEach((item) => {
        if (item.restaurant_id && item.restaurants && !restaurantsById[item.restaurant_id]) {
          restaurantsById[item.restaurant_id] = item.restaurants
        }
      })

      return {
        ...order,
        restaurants: Object.values(restaurantsById),
        itemCount: orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
      }
    })

    res.json({ assignments })
  } catch (error) {
    next(error)
  }
}

/**
 * getEarnings — summary stats for rider dashboard card.
 *
 * Request:  GET /api/rider/earnings
 * Auth:     JWT (rider)
 */
export const getEarnings = async (req, res, next) => {
  try {
    const rider = await riderModel.getByUserId(req.user.id)
    if (!rider) {
      return res.json({
        totalEarnings: 0,
        totalDeliveries: 0,
        todayEarnings: 0,
        todayDeliveries: 0,
      })
    }

    const deliveredOrders = await orderModel.getByRider(rider.id, ['delivered'])
    const now = new Date()
    const todayY = now.getFullYear()
    const todayM = now.getMonth()
    const todayD = now.getDate()

    const totals = deliveredOrders.reduce(
      (acc, order) => {
        const deliveryFee = Number(order.delivery_fee) || 0
        acc.totalEarnings += deliveryFee
        acc.totalDeliveries += 1

        const deliveredAt = order.delivered_at ? new Date(order.delivered_at) : null
        if (
          deliveredAt &&
          deliveredAt.getFullYear() === todayY &&
          deliveredAt.getMonth() === todayM &&
          deliveredAt.getDate() === todayD
        ) {
          acc.todayEarnings += deliveryFee
          acc.todayDeliveries += 1
        }

        return acc
      },
      { totalEarnings: 0, totalDeliveries: 0, todayEarnings: 0, todayDeliveries: 0 }
    )

    res.json({
      totalEarnings: Number(totals.totalEarnings.toFixed(2)),
      totalDeliveries: totals.totalDeliveries,
      todayEarnings: Number(totals.todayEarnings.toFixed(2)),
      todayDeliveries: totals.todayDeliveries,
    })
  } catch (error) {
    next(error)
  }
}
