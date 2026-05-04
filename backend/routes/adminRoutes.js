import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'
import { getAnalytics, backfillMenuAiTags } from '../controllers/adminController.js'

const router = Router()

router.get('/analytics', protect, restrictTo('admin'), getAnalytics)

router.post('/menu/backfill-ai-tags', protect, restrictTo('admin'), backfillMenuAiTags)

export default router