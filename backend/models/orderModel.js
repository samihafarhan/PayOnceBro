import supabase from '../config/db.js'

export const create = async ({ userId, riderId = null, clusterId = null, status = 'pending', totalPrice, deliveryFee, estimatedTime = null, userLat = null, userLng = null }) => {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      rider_id: riderId,
      cluster_id: clusterId,
      status,
      total_price: totalPrice,
      delivery_fee: deliveryFee,
      estimated_time: estimatedTime,
      user_lat: userLat,
      user_lng: userLng,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const createItems = async (orderId, items = []) => {
  if (!items.length) return []

  const payload = items.map((i) => ({
    order_id: orderId,
    menu_item_id: i.menuItemId,
    restaurant_id: i.restaurantId,
    quantity: i.quantity,
    price_at_order: i.priceAtOrder,
  }))

  const { data, error } = await supabase
    .from('order_items')
    .insert(payload)
    .select('*')

  if (error) throw error
  return data ?? []
}

export const getById = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, rider_id, cluster_id, status, delivered_at')
    .eq('id', orderId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const getByUser = async (userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export const getWithItems = async (orderId) => {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError && orderError.code !== 'PGRST116') throw orderError
  if (!order) return null

  const { data: items, error: itemError } = await supabase
    .from('order_items')
    .select('id, menu_item_id, restaurant_id, quantity, price_at_order')
    .eq('order_id', orderId)

  if (itemError) throw itemError

  return { order, items: items ?? [] }
}

export const updateStatus = async (orderId, status) => {
  const payload = { status }
  if (status === 'delivered') payload.delivered_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const updateRider = async (orderId, riderId) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ rider_id: riderId })
    .eq('id', orderId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const isOwnedByRestaurantOwner = async (orderId, ownerId) => {
  const { data, error } = await supabase
    .from('order_items')
    .select('id, restaurants!inner(owner_id)')
    .eq('order_id', orderId)
    .eq('restaurants.owner_id', ownerId)
    .limit(1)

  if (error) throw error
  return (data ?? []).length > 0
}

export const getRestaurantIds = async (orderId) => {
  const { data, error } = await supabase
    .from('order_items')
    .select('restaurant_id')
    .eq('order_id', orderId)

  if (error) throw error
  return [...new Set((data ?? []).map((r) => r.restaurant_id).filter(Boolean))]
}

export const insertStatusHistory = async (orderId, status, changedBy) => {
  const { error } = await supabase
    .from('order_status_history')
    .insert({
      order_id: orderId,
      status,
      changed_by: changedBy,
    })

  if (error) throw error
}
