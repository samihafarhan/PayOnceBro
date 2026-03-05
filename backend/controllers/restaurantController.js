import * as restaurantModel from '../models/restaurantModel.js'

/**
 * POST /api/restaurants
 * Creates the restaurant profile for a new restaurant_owner.
 * Returns 409 if the owner already has a restaurant.
 */
export const createRestaurant = async (req, res, next) => {
  try {
    const existing = await restaurantModel.getByOwner(req.user.id)
    if (existing) {
      return res.status(409).json({ message: 'You already have a restaurant registered.' })
    }

    const { name, address, cuisine, phone } = req.body
    if (!name) return res.status(400).json({ message: 'name is required' })

    const restaurant = await restaurantModel.createRestaurant(req.user.id, {
      name,
      address: address ?? null,
      cuisine: cuisine ?? null,
      phone:   phone   ?? null,
    })
    res.status(201).json({ restaurant })
  } catch (err) {
    next(err)
  }
}

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

// ─── Menu Management ─────────────────────────────────────────────────────────

/**
 * GET /api/restaurants/menu
 * Returns all menu items + key restaurant settings for the current owner.
 */
export const getMenu = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found for this account' })
    const items = await restaurantModel.getMenuItems(restaurant.id)
    res.json({
      items,
      restaurant: {
        avg_prep_time: restaurant.avg_prep_time ?? null,
        max_orders_per_hour: restaurant.max_capacity_per_hour ?? null,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/restaurants/menu
 * Body: { name, category?, price, description? }
 */
export const addMenuItem = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found for this account' })

    const { name, category, price, description, image_url } = req.body
    if (!name || price == null) {
      return res.status(400).json({ message: 'name and price are required' })
    }
    if (Number(price) < 0) {
      return res.status(400).json({ message: 'price must be 0 or greater' })
    }

    const item = await restaurantModel.createMenuItem(restaurant.id, {
      name,
      category: category ?? null,
      price: Number(price),
      description: description ?? null,
      image_url: image_url ?? null,
      is_available: true,
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/restaurants/menu/:itemId
 * Body: any combination of { name, category, price, description, is_available }
 */
export const editMenuItem = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found for this account' })

    const { itemId } = req.params
    const ALLOWED = ['name', 'category', 'price', 'description', 'is_available', 'image_url']
    const updates = {}
    ALLOWED.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k]
    })
    if (updates.price !== undefined) updates.price = Number(updates.price)

    const item = await restaurantModel.updateMenuItem(restaurant.id, itemId, updates)
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/restaurants/menu/:itemId
 */
export const removeMenuItem = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found for this account' })

    await restaurantModel.deleteMenuItem(restaurant.id, req.params.itemId)
    res.json({ message: 'Item deleted' })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/restaurants/profile
 * Returns the public profile fields for the current owner's restaurant.
 */
export const getProfile = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found for this account' })
    res.json({
      profile: {
        name:    restaurant.name    ?? '',
        address: restaurant.address ?? '',
        cuisine: restaurant.cuisine ?? '',
        phone:   restaurant.phone   ?? '',
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/restaurants/profile
 * Body: { name?, address?, cuisine?, phone? }
 */
export const updateProfile = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found for this account' })

    const ALLOWED = ['name', 'address', 'cuisine', 'phone']
    const fields = {}
    ALLOWED.forEach((k) => {
      if (req.body[k] !== undefined) fields[k] = req.body[k]
    })

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided' })
    }

    const updated = await restaurantModel.updateRestaurantProfile(restaurant.id, fields)
    res.json({
      profile: {
        name:    updated.name    ?? '',
        address: updated.address ?? '',
        cuisine: updated.cuisine ?? '',
        phone:   updated.phone   ?? '',
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/restaurants/settings
 * Body: { avg_prep_time?, max_orders_per_hour? }
 */
export const updateSettings = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) return res.status(404).json({ message: 'No restaurant found for this account' })

    const settings = {}
    if (req.body.avg_prep_time != null) settings.avg_prep_time = Number(req.body.avg_prep_time)
    if (req.body.max_orders_per_hour != null) settings.max_capacity_per_hour = Number(req.body.max_orders_per_hour)

    if (Object.keys(settings).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided' })
    }

    const updated = await restaurantModel.updateRestaurantSettings(restaurant.id, settings)
    res.json({ restaurant: updated })
  } catch (err) {
    next(err)
  }
}
