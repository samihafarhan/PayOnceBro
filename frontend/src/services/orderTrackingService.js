// frontend/src/services/orderTrackingService.js
// ─────────────────────────────────────────────────────────────────────────────
// Member 1 — API wrapper for the live order tracking page.
// Talks to the new backend routes under /api/order-tracking.
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'

/**
 * Fetch everything the tracking page needs about a single order:
 * { order, items, cluster, rider }
 */
export const getTrackingDetails = async (orderId) => {
  const { data } = await api.get(`/order-tracking/${orderId}`)
  return data
}

/**
 * Fetch the ordered status history (timeline) for an order:
 * { history: [{ status, created_at, ... }, ...] }
 */
export const getStatusHistory = async (orderId) => {
  const { data } = await api.get(`/order-tracking/${orderId}/history`)
  return data.history ?? []
}
