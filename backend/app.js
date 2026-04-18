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
import clusterRoutes from './routes/clusterRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRestaurantRoutes from './routes/publicRestaurantRoutes.js';
import orderTrackingRoutes    from './routes/orderTrackingRoutes.js';

const app = express();

const normalizeOrigin = (value) => {
  if (!value || typeof value !== 'string') return null;
  return value.trim().replace(/\/+$/, '').toLowerCase();
};

const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((v) => normalizeOrigin(v))
  .filter(Boolean);

const isLocalhostOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    const normalized = normalizeOrigin(origin);
    const isAllowedConfigured = normalized ? configuredOrigins.includes(normalized) : false;

    if (!origin || isAllowedConfigured || (normalized && isLocalhostOrigin(normalized))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed. Add it to FRONTEND_URL in backend/.env`));
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
app.use('/api/cluster',     clusterRoutes);
app.use('/api/rider',       riderRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/ratings',     ratingRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/public/restaurants', publicRestaurantRoutes);
app.use('/api/order-tracking',     orderTrackingRoutes);
app.use(errorHandler);

export default app;