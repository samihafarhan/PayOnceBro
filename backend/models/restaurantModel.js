import supabase from '../config/db.js'

// Creates a new restaurant for the given owner
export const createRestaurant = async (ownerId, fields) => {
  const { data, error } = await supabase
    .from('restaurants')
    .insert({ ...fields, owner_id: ownerId })
    .select()
    .single()
  if (error) throw error
  return data
}

// Returns the restaurant owned by this auth user
export const getByOwner = async (ownerId) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', ownerId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

// All order_item rows that belong to this restaurant, with menu item names
export const getOrderItemsByRestaurant = async (restaurantId) => {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      quantity,
      price_at_order,
      menu_items (id, name, category)
    `)
    .eq('restaurant_id', restaurantId)
  if (error) throw error
  return data ?? []
}

// Active orders (pending / accepted / preparing / pickup) for given IDs
export const getActiveOrdersByIds = async (orderIds) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_price, delivery_fee, estimated_time, cluster_id, created_at')
    .in('id', orderIds)
    .in('status', ['pending', 'accepted', 'preparing', 'pickup'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Today's delivered orders for the completed tab
export const getCompletedOrdersByIds = async (orderIds) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_price, delivery_fee, estimated_time, cluster_id, created_at')
    .in('id', orderIds)
    .eq('status', 'delivered')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Cluster rows for enriching clustered orders
export const getClustersByIds = async (clusterIds) => {
  const { data, error } = await supabase
    .from('clusters')
    .select('id, restaurant_ids, is_active')
    .in('id', clusterIds)
  if (error) throw error
  return data ?? []
}

// Fetch a single order for status-transition validation
export const getOrderById = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, cluster_id')
    .eq('id', orderId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const updateOrderStatus = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Menu Items ──────────────────────────────────────────────────────────────

export const getMenuItems = async (restaurantId) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('category', { ascending: true })
  if (error) throw error
  return data ?? []
}

export const createMenuItem = async (restaurantId, item) => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({ ...item, restaurant_id: restaurantId })
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateMenuItem = async (restaurantId, itemId, updates) => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', itemId)
    .eq('restaurant_id', restaurantId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteMenuItem = async (restaurantId, itemId) => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', itemId)
    .eq('restaurant_id', restaurantId)
  if (error) throw error
}

// ─── Restaurant Settings ──────────────────────────────────────────────────────

export const updateRestaurantSettings = async (restaurantId, settings) => {
  const { data, error } = await supabase
    .from('restaurants')
    .update(settings)
    .eq('id', restaurantId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Restaurant Profile (public info) ────────────────────────────────────────

export const updateRestaurantProfile = async (restaurantId, fields) => {
  const { data, error } = await supabase
    .from('restaurants')
    .update(fields)
    .eq('id', restaurantId)
    .select()
    .single()
  if (error) throw error
  return data
}
