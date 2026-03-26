// backend/routes/riderRoutes.js
// URL → Controller mapping for rider endpoints

import { Router } from 'express'
import { updateLocation, getLocation, getProfile } from '../controllers/riderController.js'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'

const router = Router()

// All rider routes require JWT authentication
router.use(protect)

/**
 * GET /api/rider/profile/me
 * Fetch logged-in rider's full profile
 * NOTE: This must come BEFORE /:id routes to avoid parameter collision
 */
router.get('/profile/me', getProfile)

/**
 * PUT /api/rider/location
 * Update rider's current GPS coordinates (called every 30s)
 */
router.put('/location', updateLocation)

/**
 * GET /api/rider/:id/location
 * Fetch a specific rider's current location (publicly available for tracking)
 */
router.get('/:id/location', getLocation)

export default router
