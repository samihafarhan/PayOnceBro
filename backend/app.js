import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { errorHandler } from './middleware/errorMiddleware.js'
import authRoutes from './routes/authRoutes.js'
import restaurantRoutes from './routes/restaurantRoutes.js'

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.FRONTEND_URL
    // In production, only allow the configured FRONTEND_URL
    // In development, allow any localhost origin regardless of port
    if (!origin || origin === allowed || (!allowed && origin.startsWith('http://localhost'))) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`))
    }
  },
  credentials: true,
}))
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)

// Each member mounts their routes here in later sprints

app.use(errorHandler)

export default app
