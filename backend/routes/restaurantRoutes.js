import { Router } from 'express'
import { getOrders, updateOrderStatus } from '../controllers/restaurantController.js'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'

const router = Router()

router.get('/orders', protect, restrictTo('restaurant_owner'), getOrders)
router.put('/orders/:orderId/status', protect, restrictTo('restaurant_owner'), updateOrderStatus)

export default router
