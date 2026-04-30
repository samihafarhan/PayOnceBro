import * as restaurantModel from '../models/restaurantModel.js'
import * as menuModel from '../models/menuModel.js'
import { findBestRider } from '../services/riderAssignmentService.js'
import { generateMenuTags } from '../services/geminiService.js'

const inferFallbackTags = (name = '', description = '') => {
  const text = `${name} ${description}`.toLowerCase()
  const tags = new Set()
  const hasMeat = /\b(beef|chicken|mutton|lamb|prawn|shrimp|fish|tuna|salmon)\b/.test(text)

  if (/\bvegan\b|tofu|plant\s*-?\s*based/.test(text)) tags.add('vegan')
  // Do not mark vegetarian when the same text clearly mentions meat.
  if ((/\bvegetarian\b|paneer|veggie/.test(text) || (/vegetable/.test(text) && !hasMeat)) && !hasMeat) {
    tags.add('vegetarian')
  }
  if (/\bhalal\b|beef|chicken|mutton|lamb/.test(text)) tags.add('halal')
  if (/spicy|chili|chilli|hot\b|jalapeno|pepper/.test(text)) tags.add('spicy')
  if (/\bmild\b|lightly\s+spiced|butter/.test(text)) tags.add('mild')
  if (/sweet|dessert|cake|chocolate|honey|sugar/.test(text)) tags.add('sweet')
  if (/gluten\s*-?\s*free|\bgf\b/.test(text)) tags.add('gluten-free')
  if (/dairy\s*-?\s*free|lactose\s*-?\s*free/.test(text) || tags.has('vegan')) tags.add('dairy-free')
  if (/high\s*-?\s*protein|protein\b|beef|chicken|egg/.test(text)) tags.add('high-protein')
  if (/low\s*-?\s*calorie|salad|steamed|grilled/.test(text)) tags.add('low-calorie')

  return Array.from(tags)
}

const getMenuTags = async (name = '', description = '') => {
  const fallback = inferFallbackTags(name, description)
  // #region agent log
  fetch('http://127.0.0.1:7418/ingest/e23e83d9-a344-4b52-b5e9-54a81aa66b54',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'27b7b0'},body:JSON.stringify({sessionId:'27b7b0',runId:'pre-fix',hypothesisId:'H3',location:'backend/controllers/restaurantController.js:getMenuTags:entry',message:'Tag generation started with fallback precomputed',data:{nameLength:name.length,descriptionLength:description.length,fallbackTags:fallback,fallbackCount:fallback.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  try {
    const aiTags = await generateMenuTags(name, description)
    // #region agent log
    fetch('http://127.0.0.1:7418/ingest/e23e83d9-a344-4b52-b5e9-54a81aa66b54',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'27b7b0'},body:JSON.stringify({sessionId:'27b7b0',runId:'pre-fix',hypothesisId:'H3',location:'backend/controllers/restaurantController.js:getMenuTags:afterAi',message:'AI tags returned from Gemini service',data:{aiTags:Array.isArray(aiTags)?aiTags:[],aiTagCount:Array.isArray(aiTags)?aiTags.length:0},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (Array.isArray(aiTags) && aiTags.length > 0) {
      const merged = [...new Set([...aiTags, ...fallback])]
      // #region agent log
      fetch('http://127.0.0.1:7418/ingest/e23e83d9-a344-4b52-b5e9-54a81aa66b54',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'27b7b0'},body:JSON.stringify({sessionId:'27b7b0',runId:'pre-fix',hypothesisId:'H3',location:'backend/controllers/restaurantController.js:getMenuTags:merged',message:'Merged AI and fallback tags',data:{mergedTags:merged,mergedCount:merged.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return merged
    }
  } catch {
    // Fallback below
  }

  // #region agent log
  fetch('http://127.0.0.1:7418/ingest/e23e83d9-a344-4b52-b5e9-54a81aa66b54',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'27b7b0'},body:JSON.stringify({sessionId:'27b7b0',runId:'pre-fix',hypothesisId:'H4',location:'backend/controllers/restaurantController.js:getMenuTags:fallbackOnly',message:'Using fallback tags only',data:{fallbackTags:fallback,fallbackCount:fallback.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return fallback
}

const getDefaultRestaurantName = (email) => {
  const fallback = 'My Restaurant'
  if (!email) return fallback
  const local = email.split('@')[0]?.trim()
  if (!local) return fallback
  return `${local} Restaurant`
}

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

    // Keep assignment behavior consistent with /orders/:id/status flow.
    if (status === 'accepted') {
      try {
        await findBestRider(orderId)
      } catch (assignErr) {
        console.error(`❌ Rider assignment failed for order ${orderId}:`, assignErr?.message || assignErr)
      }
    }

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

    let taggedItem = item
    try {
      const tags = await getMenuTags(item.name, item.description)
      taggedItem = await menuModel.updateTags(item.id, tags)
      // #region agent log
      fetch('http://127.0.0.1:7418/ingest/e23e83d9-a344-4b52-b5e9-54a81aa66b54',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'27b7b0'},body:JSON.stringify({sessionId:'27b7b0',runId:'pre-fix',hypothesisId:'H5',location:'backend/controllers/restaurantController.js:addMenuItem:dbWrite',message:'Tags written to menu item',data:{itemId:item.id,savedTags:Array.isArray(taggedItem?.ai_tags)?taggedItem.ai_tags:[],savedTagCount:Array.isArray(taggedItem?.ai_tags)?taggedItem.ai_tags.length:0},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } catch {
      // Menu write should still succeed even if AI tagging fails.
    }

    res.status(201).json({ item: taggedItem })
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

    const shouldRegenerateTags = updates.name !== undefined || updates.description !== undefined
    if (!shouldRegenerateTags) {
      return res.json({ item })
    }

    let taggedItem = item
    try {
      const tags = await getMenuTags(item.name, item.description)
      taggedItem = await menuModel.updateTags(item.id, tags)
    } catch {
      // Keep successful menu updates even if Gemini is unavailable.
    }

    res.json({ item: taggedItem })
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
    let restaurant = await restaurantModel.getByOwner(req.user.id)
    if (!restaurant) {
      restaurant = await restaurantModel.createRestaurant(req.user.id, {
        name: getDefaultRestaurantName(req.user?.email),
      })
    }
    res.json({
      profile: {
        id: restaurant.id,
        owner_id: restaurant.owner_id,
        name: restaurant.name ?? '',
        address: restaurant.address ?? '',
        lat: restaurant.lat,
        lng: restaurant.lng,
        avg_prep_time: restaurant.avg_prep_time,
        max_capacity_per_hour: restaurant.max_capacity_per_hour,
        is_active: restaurant.is_active,
        avg_rating: restaurant.avg_rating,
        created_at: restaurant.created_at,
        cuisine: restaurant.cuisine ?? '',
        prep_time_minutes: restaurant.prep_time_minutes,
        phone: restaurant.phone ?? '',
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
    let restaurant = await restaurantModel.getByOwner(req.user.id)

    const ALLOWED = [
      'name',
      'address',
      'lat',
      'lng',
      'avg_prep_time',
      'max_capacity_per_hour',
      'is_active',
      'cuisine',
      'prep_time_minutes',
      'phone',
    ]
    const fields = {}
    ALLOWED.forEach((k) => {
      if (req.body[k] !== undefined) fields[k] = req.body[k]
    })

    if (fields.lat != null) fields.lat = Number(fields.lat)
    if (fields.lng != null) fields.lng = Number(fields.lng)
    if (fields.avg_prep_time != null) fields.avg_prep_time = Number(fields.avg_prep_time)
    if (fields.max_capacity_per_hour != null) fields.max_capacity_per_hour = Number(fields.max_capacity_per_hour)
    if (fields.prep_time_minutes != null) fields.prep_time_minutes = Number(fields.prep_time_minutes)
    if (fields.is_active != null) {
      if (typeof fields.is_active === 'string') {
        fields.is_active = fields.is_active.toLowerCase() === 'true'
      } else {
        fields.is_active = !!fields.is_active
      }
    }

    if (fields.lat != null && Number.isNaN(fields.lat)) return res.status(400).json({ message: 'lat must be a valid number' })
    if (fields.lng != null && Number.isNaN(fields.lng)) return res.status(400).json({ message: 'lng must be a valid number' })
    if (fields.avg_prep_time != null && Number.isNaN(fields.avg_prep_time)) return res.status(400).json({ message: 'avg_prep_time must be a valid number' })
    if (fields.max_capacity_per_hour != null && Number.isNaN(fields.max_capacity_per_hour)) return res.status(400).json({ message: 'max_capacity_per_hour must be a valid number' })
    if (fields.prep_time_minutes != null && Number.isNaN(fields.prep_time_minutes)) return res.status(400).json({ message: 'prep_time_minutes must be a valid number' })

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided' })
    }

    if (!restaurant) {
      const seed = {
        name: fields.name || getDefaultRestaurantName(req.user?.email),
        address: fields.address ?? null,
        cuisine: fields.cuisine ?? null,
        phone: fields.phone ?? null,
        lat: fields.lat ?? null,
        lng: fields.lng ?? null,
        avg_prep_time: fields.avg_prep_time ?? null,
        max_capacity_per_hour: fields.max_capacity_per_hour ?? null,
        prep_time_minutes: fields.prep_time_minutes ?? null,
        is_active: fields.is_active ?? true,
      }
      restaurant = await restaurantModel.createRestaurant(req.user.id, seed)
    }

    const updated = await restaurantModel.updateRestaurantProfile(restaurant.id, fields)
    res.json({
      profile: {
        id: updated.id,
        owner_id: updated.owner_id,
        name: updated.name ?? '',
        address: updated.address ?? '',
        lat: updated.lat,
        lng: updated.lng,
        avg_prep_time: updated.avg_prep_time,
        max_capacity_per_hour: updated.max_capacity_per_hour,
        is_active: updated.is_active,
        avg_rating: updated.avg_rating,
        created_at: updated.created_at,
        cuisine: updated.cuisine ?? '',
        prep_time_minutes: updated.prep_time_minutes,
        phone: updated.phone ?? '',
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
