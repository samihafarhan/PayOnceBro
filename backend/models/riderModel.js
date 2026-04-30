// backend/models/riderModel.js
// Data layer — raw Supabase queries only, no business logic

import supabase from '../config/db.js'
const isMissingRow = (error) => error?.code === 'PGRST116'

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
    if (isMissingRow(error)) return null
    throw error
  }
  return data
}

/**
 * getByUserId — fetch rider row by authenticated user id.
 */
export const getByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('riders')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (isMissingRow(error)) return null
    throw error
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
 * updateLocationByUserId — update rider coords using user_id.
 */
export const updateLocationByUserId = async (userId, lat, lng) => {
  const { data, error } = await supabase
    .from('riders')
    .update({
      current_lat: lat,
      current_lng: lng,
    })
    .eq('user_id', userId)
    .select('id, user_id, current_lat, current_lng')
    .single()

  if (error) {
    if (isMissingRow(error)) return null
    throw error
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
    if (isMissingRow(error)) return null
    throw error
  }
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
    })
    .eq('id', riderId)
    .select('total_deliveries')
    .single()

  if (error) throw error
  return data
}

/**
 * updateRating — update rider's average rating after a new rating is submitted.
 * Called by ratingController after creating a new rider rating.
 */
export const updateRating = async (riderId, avgRating) => {
  const { data, error } = await supabase
    .from('riders')
    .update({ avg_rating: avgRating })
    .eq('id', riderId)
    .select('id, avg_rating')
    .single()

  if (error) throw error
  return data
}
