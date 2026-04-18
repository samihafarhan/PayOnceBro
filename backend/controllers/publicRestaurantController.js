// backend/controllers/publicRestaurantController.js
// ─────────────────────────────────────────────────────────────────────────────
// Member 1 — Public Restaurant Profile
//
// This controller exposes a PUBLIC (any authenticated user) read-only view of
// a single restaurant: its profile fields + its full available menu.
//
// It's intentionally separate from restaurantController.js (Member 3), which
// is scoped to restaurant OWNERS editing their OWN restaurant. We don't touch
// Member 3's controller — we read from the DB in our own controller instead.
//
// Mounted at: GET /api/public/restaurants/:id    → getRestaurantProfile
// ─────────────────────────────────────────────────────────────────────────────

import supabase from '../config/db.js'

/**
 * GET /api/public/restaurants/:id
 *
 * Returns:
 * {
 *   restaurant: { id, name, address, cuisine, phone, lat, lng,
 *                 avg_rating, avg_prep_time, is_active, ... },
 *   menu: [ { id, name, description, price, category, is_available,
 *             ai_tags, image_url } ... ]
 * }
 *
 * We use `select('*')` on both queries rather than listing columns, because
 * the schema has evolved across the project and some optional columns may
 * or may not exist (e.g. image_url on restaurants). Returning extra columns
 * is harmless; returning a 500 because one column is missing is not.
 *
 * Only returns restaurants where is_active = true.
 * Only returns menu items where is_available = true.
 */
export const getRestaurantProfile = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ message: 'Restaurant id is required' })
    }

    // 1. Fetch the restaurant itself
    const { data: restaurant, error: restaurantErr } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    // PGRST116 = no rows
    if (restaurantErr && restaurantErr.code !== 'PGRST116') {
      console.error('getRestaurantProfile restaurants query error:', restaurantErr)
      throw restaurantErr
    }
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found or inactive' })
    }

    // 2. Fetch the menu (only available items)
    const { data: menuItems, error: menuErr } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', id)
      .eq('is_available', true)
      .order('category', { ascending: true })
      .order('price', { ascending: true })

    if (menuErr) {
      console.error('getRestaurantProfile menu_items query error:', menuErr)
      throw menuErr
    }

    res.json({
      restaurant,
      menu: menuItems ?? [],
    })
  } catch (err) {
    // Surface the underlying DB error so the frontend/log can see it
    console.error('getRestaurantProfile failed:', err?.message || err)
    next(err)
  }
}