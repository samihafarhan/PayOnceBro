import { Router } from 'express'
import { calculateFee, estimateTime } from '../controllers/deliveryController.js'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'

const router = Router()

// POST /api/delivery/fee — calculate delivery fee for given restaurants and user location
router.post('/fee', protect, restrictTo('user'), calculateFee)
router.post('/eta', protect, restrictTo('user'), estimateTime)

export default router
