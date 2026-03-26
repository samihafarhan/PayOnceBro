import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'
import { create, getByRestaurant, addResponse } from '../controllers/ratingController.js'

const router = Router()

router.post('/', protect, restrictTo('user'), create)
router.get('/restaurant/:id', getByRestaurant)
router.post('/:id/response', protect, restrictTo('restaurant_owner'), addResponse)

export default router
