import { Router } from 'express'
import { search, getCategories } from '../controllers/searchController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

// GET /api/search?q=burger&minPrice=50&maxPrice=300&cuisine=fast-food&userLat=X&userLng=Y
router.get('/', protect, search)

// GET /api/search/categories  — for the cuisine filter dropdown
router.get('/categories', protect, getCategories)

export default router