// backend/routes/publicRestaurantRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Member 1 — Public (read-only) restaurant endpoints consumed by the
// user-facing RestaurantProfile page.
//
// Kept separate from restaurantRoutes.js (Member 3) to avoid touching their
// file. Mounted at `/api/public/restaurants` in backend/app.js.
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { getRestaurantProfile } from '../controllers/publicRestaurantController.js'

const router = Router()

// Any authenticated user may view a restaurant's public profile
router.get('/:id', protect, getRestaurantProfile)

export default router
