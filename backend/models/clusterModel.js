import supabase from '../config/db.js'

export const create = async (restaurantIds = []) => {
  const { data, error } = await supabase
    .from('clusters')
    .insert({ restaurant_ids: restaurantIds, is_active: true })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const getById = async (clusterId) => {
  if (!clusterId) return null

  const { data, error } = await supabase
    .from('clusters')
    .select('*')
    .eq('id', clusterId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const getByOrder = async (orderId) => {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('cluster_id')
    .eq('id', orderId)
    .single()

  if (orderErr && orderErr.code !== 'PGRST116') throw orderErr
  if (!order?.cluster_id) return null

  return getById(order.cluster_id)
}

export const assignRider = async (clusterId, riderId) => {
  const { data, error } = await supabase
    .from('clusters')
    .update({ rider_id: riderId, is_active: true })
    .eq('id', clusterId)
    .select('*')
    .single()

  if (error) throw error
  return data
}
