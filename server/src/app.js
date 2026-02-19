import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { connectDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: function (origin, cb) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return cb(null, true);
      const allowed = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
      // Also accept the next Vite port in case 5173 is busy
      if (!allowed.includes('http://localhost:5174')) allowed.push('http://localhost:5174');
      if (allowed.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true })); // Required for PayHere notify POST
app.use(morgan('dev'));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many requests, please try again later.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many auth attempts, please try again later.' } });
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Vercel serverless: ensure DB is connected before handling API routes
if (process.env.VERCEL) {
  let dbReady = null;
  app.use('/api', (req, res, next) => {
    if (!dbReady) {
      dbReady = connectDatabase().catch((err) => {
        console.error('DB connection failed:', err.message);
        dbReady = null;
        throw err;
      });
    }
    dbReady.then(() => next()).catch(() => {
      dbReady = null;
      res.status(500).json({ message: 'Database connection failed' });
    });
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/promo-codes', promoRoutes);
app.use('/api/payhere', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

export default app;
