// backend/routes/orderTrackingRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Member 1 — Order tracking routes for the user.
// Kept separate from orderRoutes.js (which is shared across members).
// Mounted at `/api/order-tracking` in backend/app.js.
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'
import {
  getTrackingDetails,
  getStatusHistory,
} from '../controllers/orderTrackingController.js'

const router = Router()

// Customer-only
router.get('/:id', protect, restrictTo('user'), getTrackingDetails)
router.get('/:id/history', protect, restrictTo('user'), getStatusHistory)

export default router
