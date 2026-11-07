import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().catch(() => {});

// CORS Configuration supporting CORS_ORIGIN
const corsOrigin = process.env.CORS_ORIGIN || '*';
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsOrigin === '*') return callback(null, true);
    const origins = corsOrigin.split(',').map((s) => s.trim());
    if (origins.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Inisio - Greenfield Project Consultancy & Bank Funding API',
    documentation: '/api/health',
    status: 'active',
  });
});

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Inisio Backend REST API Server is running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
