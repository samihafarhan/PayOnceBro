import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { register, login, logout, getMe } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

// Brute-force protection: max 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later.' },
})

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)

export default router
