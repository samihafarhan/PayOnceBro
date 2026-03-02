import * as restaurantModel from '../models/restaurantModel.js'

// Restaurant role: which status transitions are allowed
const ALLOWED_TRANSITIONS = {
  pending:  ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['cancelled'],
}

/**
 * GET /api/restaurants/orders
 * Returns orders grouped into pending | preparing | pickup | completed.
 * Each order includes:
 *   myItems[]         — items from THIS restaurant (for the kitchen)
 *   isClusteredOrder  — boolean
 *   cluster           — { id, restaurant_ids, restaurantCount } | null
 *   restaurantPrepTime — minutes, drives the frontend countdown timer
 */
export const getOrders = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) {
      return res.status(404).json({ message: 'No restaurant found for this account' })
    }

    const myItems = await restaurantModel.getOrderItemsByRestaurant(restaurant.id)
    if (myItems.length === 0) {
      return res.json({ pending: [], preparing: [], pickup: [], completed: [] })
    }

    const orderIds = [...new Set(myItems.map((i) => i.order_id))]

    const [activeOrders, completedOrders] = await Promise.all([
      restaurantModel.getActiveOrdersByIds(orderIds),
      restaurantModel.getCompletedOrdersByIds(orderIds),
    ])

    const allOrders = [...activeOrders, ...completedOrders]
    if (allOrders.length === 0) {
      return res.json({ pending: [], preparing: [], pickup: [], completed: [] })
    }

    // Fetch cluster details for any clustered orders
    const clusterIds = [...new Set(allOrders.filter((o) => o.cluster_id).map((o) => o.cluster_id))]
    const clustersMap = {}
    if (clusterIds.length > 0) {
      const clusters = await restaurantModel.getClustersByIds(clusterIds)
      clusters.forEach((c) => {
        clustersMap[c.id] = {
          ...c,
          restaurantCount: Array.isArray(c.restaurant_ids) ? c.restaurant_ids.length : 0,
        }
      })
    }

    const itemsByOrder = myItems.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = []
      acc[item.order_id].push(item)
      return acc
    }, {})

    const enriched = allOrders.map((order) => ({
      ...order,
      myItems: itemsByOrder[order.id] ?? [],
      isClusteredOrder: !!order.cluster_id,
      cluster: order.cluster_id ? (clustersMap[order.cluster_id] ?? null) : null,
      // Used by the frontend PrepTimer — starts counting down on 'accepted'
      restaurantPrepTime: restaurant.avg_prep_time ?? 30,
    }))

    res.json({
      pending:   enriched.filter((o) => o.status === 'pending'),
      preparing: enriched.filter((o) => ['accepted', 'preparing'].includes(o.status)),
      pickup:    enriched.filter((o) => o.status === 'pickup'),
      completed: enriched.filter((o) => o.status === 'delivered'),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/restaurants/orders/:orderId/status
 * Body: { status: 'accepted' | 'preparing' | 'cancelled' }
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const { status } = req.body
    if (!status) return res.status(400).json({ message: 'status is required' })

    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found for this account' })

    // Verify this order belongs to the restaurant
    const myItems = await restaurantModel.getOrderItemsByRestaurant(restaurant.id)
    if (!myItems.some((i) => i.order_id === orderId)) {
      return res.status(403).json({ message: 'This order does not belong to your restaurant' })
    }

    const order = await restaurantModel.getOrderById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const allowed = ALLOWED_TRANSITIONS[order.status]
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition '${order.status}' → '${status}'. Allowed: ${(allowed ?? []).join(', ') || 'none'}`,
      })
    }

    const updated = await restaurantModel.updateOrderStatus(orderId, status)

    // Sprint 3 handoff (Member D): when status === 'accepted', call findBestRider here

    res.json({ order: updated })
  } catch (err) {
    next(err)
  }
}
