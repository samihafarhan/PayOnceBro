// frontend/src/services/riderService.js
// Axios API call functions for rider-related endpoints

import api from './api.js'

/**
 * updateLocation — Send rider's current GPS coordinates to the backend.
 * Called every 30 seconds by useRiderLocation hook.
 */
export const updateLocation = async (lat, lng) => {
  const { data } = await api.put('/rider/location', { lat, lng })
  return data
}

/**
 * getLocation — Fetch a specific rider's current location.
 * Used by customers tracking their delivery.
 */
export const getLocation = async (riderId) => {
  const { data } = await api.get(`/rider/${riderId}/location`)
  return data
}

/**
 * getProfile — Fetch the logged-in rider's full profile.
 * Includes availability status, rating, total deliveries.
 */
export const getProfile = async () => {
  const { data } = await api.get('/rider/profile/me')
  return data
}

export const getAssignments = async () => {
  const { data } = await api.get('/rider/assignments')
  return data.assignments ?? []
}

export const getEarnings = async () => {
  const { data } = await api.get('/rider/earnings')
  return data
}
