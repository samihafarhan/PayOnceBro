import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'
import { placeOrder, getById, getByUser, updateStatus } from '../controllers/orderController.js'

const router = Router()

router.post('/', protect, restrictTo('user'), placeOrder)
router.get('/my', protect, restrictTo('user'), getByUser)
router.get('/:id', protect, getById)
router.put('/:id/status', protect, updateStatus)

export default router
