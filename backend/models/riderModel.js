// backend/models/riderModel.js
// Data layer — raw Supabase queries only, no business logic

import supabase from '../config/db.js'

/**
 * getById — fetch a single rider by ID with all fields.
 * Returns null if rider doesn't exist (instead of throwing).
 */
export const getById = async (id) => {
  const { data, error } = await supabase
    .from('riders')
    .select('*')
    .eq('id', id)
    .single()

  // .single() throws if no rows or > 1 rows — handle gracefully
  if (error) {
    console.error('Rider getById error:', error)
    return null
  }
  return data
}

/**
 * getAvailable — fetch all riders with is_available = true.
 * Used by riderAssignmentService to find candidates for a delivery.
 */
export const getAvailable = async () => {
  const { data, error } = await supabase
    .from('riders')
    .select('id, user_id, current_lat, current_lng, is_available, avg_rating, total_deliveries')
    .eq('is_available', true)

  if (error) throw error
  return data ?? []
}

/**
 * updateLocation — update rider's current coordinates.
 * Called every 30 seconds by the rider's location tracker.
 * Returns null if rider doesn't exist or fails to update.
 */
export const updateLocation = async (riderId, lat, lng) => {
  const { data, error } = await supabase
    .from('riders')
    .update({
      current_lat: lat,
      current_lng: lng,
      updated_at: new Date().toISOString(),
    })
    .eq('id', riderId)
    .select('id, current_lat, current_lng')
    .single()

  if (error) {
    console.error('Failed to update rider location:', error)
    return null
  }
  return data
}

/**
 * setAvailable — mark a rider as available or unavailable.
 * Available = true: ready to accept deliveries
 * Available = false: currently on a delivery, cannot accept more
 */
export const setAvailable = async (riderId, isAvailable) => {
  const { data, error } = await supabase
    .from('riders')
    .update({
      is_available: isAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq('id', riderId)
    .select('id, is_available')
    .single()

  if (error) throw error
  return data
}

/**
 * getLocation — fetch only the current location of a rider.
 * Returns null if rider doesn't exist.
 */
export const getLocation = async (riderId) => {
  const { data, error } = await supabase
    .from('riders')
    .select('id, current_lat, current_lng')
    .eq('id', riderId)
    .single()

  if (error) {
    console.error('Rider getLocation error:', error)
    return null
  }
  return data
}

/**
 * create — create a new rider record (triggered when a user registers as rider).
 */
export const create = async (userId, lat = 0, lng = 0) => {
  const { data, error } = await supabase
    .from('riders')
    .insert({
      user_id: userId,
      current_lat: lat,
      current_lng: lng,
      is_available: true,
      avg_rating: 0,
      total_deliveries: 0,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * updateStats — increment total_deliveries after successful delivery.
 * This is called by the order controller when an order is marked delivered.
 */
export const updateStats = async (riderId, totalDeliveries) => {
  const { data, error } = await supabase
    .from('riders')
    .update({
      total_deliveries: totalDeliveries,
      updated_at: new Date().toISOString(),
    })
    .eq('id', riderId)
    .select('total_deliveries')
    .single()

  if (error) throw error
  return data
}
