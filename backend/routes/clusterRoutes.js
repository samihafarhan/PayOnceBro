// backend/routes/clusterRoutes.js

import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { restrictTo } from '../middleware/roleMiddleware.js'
import {
  checkCluster,
  getNearbyClusters,
  getDeliveryFee,
  getETA,
  getAllClusters,
} from '../controllers/clusterController.js'

const router = Router()

// POST /api/cluster/check
// Cart page calls this when user has items from 2+ restaurants
router.post('/check', protect, restrictTo('user'), checkCluster)

// GET /api/cluster/nearby?userLat=X&userLng=Y&radius=2
// Search page calls this to show cluster banners
router.get('/nearby', protect, getNearbyClusters)

// POST /api/cluster/fee
// Calculates delivery fee (cluster or normal)
router.post('/fee', protect, restrictTo('user'), getDeliveryFee)

// POST /api/cluster/eta
// Estimates delivery time
router.post('/eta', protect, restrictTo('user'), getETA)

// GET /api/cluster/all
// Dev/admin: see all clusters across all restaurants
router.get('/all', protect, restrictTo('admin'), getAllClusters)

export default router