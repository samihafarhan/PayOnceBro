import { Router } from 'express'
import { calculateFee } from '../controllers/deliveryController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

// POST /api/delivery/fee — calculate delivery fee for given restaurants and user location
router.post('/fee', protect, calculateFee)

export default router
