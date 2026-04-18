// frontend/src/services/publicRestaurantService.js
// ─────────────────────────────────────────────────────────────────────────────
// Member 1 — thin API wrapper used by the user-facing RestaurantProfile page.
//
// This service calls:
//   1. Our OWN new backend endpoint for restaurant + menu (public read)
//      GET /api/public/restaurants/:id
//   2. Member 3's EXISTING public reviews endpoint (we just consume it, we
//      don't touch their files) — GET /api/ratings/restaurant/:id
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'

/**
 * Fetch a restaurant's public profile + available menu.
 *
 * @param {string} restaurantId
 * @returns {Promise<{ restaurant: object, menu: array }>}
 */
export const getPublicRestaurant = async (restaurantId) => {
  const { data } = await api.get(`/public/restaurants/${restaurantId}`)
  return data
}

/**
 * Fetch all reviews for a restaurant.
 *
 * Member 3 already owns this endpoint: GET /api/ratings/restaurant/:id
 * We just consume it — we don't modify their controller/routes.
 *
 * @param {string} restaurantId
 * @returns {Promise<array>} list of rating rows
 */
export const getPublicRestaurantReviews = async (restaurantId) => {
  try {
    const { data } = await api.get(`/ratings/restaurant/${restaurantId}`)
    // The endpoint returns an array directly (see ratingController.getByRestaurant)
    return Array.isArray(data) ? data : []
  } catch (err) {
    // Reviews are optional on the profile page — don't blow up the UI if the
    // endpoint fails or returns an unexpected shape.
    console.warn('Reviews fetch failed:', err?.message)
    return []
  }
}
