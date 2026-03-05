import { Router } from 'express'
import {
  createRestaurant,
  getOrders,
  updateOrderStatus,
  getMenu,
  addMenuItem,
  editMenuItem,
  removeMenuItem,
  updateSettings,
  getProfile,
  updateProfile,
} from '../controllers/restaurantController.js'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'

const router = Router()

// Onboarding — create restaurant for a new owner
router.post('/', protect, restrictTo('restaurant_owner'), createRestaurant)

// Orders
router.get('/orders', protect, restrictTo('restaurant_owner'), getOrders)
router.put('/orders/:orderId/status', protect, restrictTo('restaurant_owner'), updateOrderStatus)

// Menu
router.get('/menu', protect, restrictTo('restaurant_owner'), getMenu)
router.post('/menu', protect, restrictTo('restaurant_owner'), addMenuItem)
router.put('/menu/:itemId', protect, restrictTo('restaurant_owner'), editMenuItem)
router.delete('/menu/:itemId', protect, restrictTo('restaurant_owner'), removeMenuItem)

// Restaurant settings (prep time, capacity)
router.put('/settings', protect, restrictTo('restaurant_owner'), updateSettings)

// Public profile
router.get('/profile', protect, restrictTo('restaurant_owner'), getProfile)
router.put('/profile', protect, restrictTo('restaurant_owner'), updateProfile)

export default router
