// backend/app.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import clusterRoutes from './routes/clusterRoutes.js';   // ← ADD THIS

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.FRONTEND_URL;
    if (!origin || origin === allowed || (!allowed && origin.startsWith('http://localhost'))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth',        authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/search',      searchRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/cluster',     clusterRoutes);   // ← ADD THIS

app.use(errorHandler);

export default app;