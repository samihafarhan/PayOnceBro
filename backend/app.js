<<<<<<< HEAD
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
=======
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { errorHandler } from './middleware/errorMiddleware.js'
import authRoutes from './routes/authRoutes.js'
import restaurantRoutes from './routes/restaurantRoutes.js'
import searchRoutes from './routes/searchRoutes.js'
import restaurantRoutes from './routes/restaurantRoutes.js'
import searchRoutes from './routes/searchRoutes.js'   // ← NEW
app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.FRONTEND_URL
    if (!origin || origin === allowed || (!allowed && origin.startsWith('http://localhost'))) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`))
    }
  },
  credentials: true,
}))

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/search', searchRoutes)

<<<<<<< HEAD
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
=======
app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.FRONTEND_URL
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
>>>>>>> e37108f92aaaeaedcefaabe81782e553b8022a50

// Auth routes
app.use('/api/auth', authRoutes);

<<<<<<< HEAD
app.use(errorHandler);
export default app;
=======
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/search', searchRoutes)   // ← NEW

app.use(errorHandler)

export default app
>>>>>>> e37108f92aaaeaedcefaabe81782e553b8022a50
