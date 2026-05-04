import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'
import { getAnalytics, getDemandZones } from '../controllers/adminController.js'

const router = Router()

router.get('/analytics', protect, restrictTo('admin'), getAnalytics)
router.get('/demand-zones', protect, restrictTo('admin'), getDemandZones)

export default router