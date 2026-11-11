import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import config from './config/env.js';
import logger from './utils/logger.js';
import connectDB, { isDBConnected } from './config/db.js';
import seedDatabase from './data/seedDatabase.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { generalApiLimiter } from './middleware/rateLimitMiddleware.js';

const app = express();
const PORT = config.port || 5000;

// 1. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. Response Compression
app.use(compression());

// 3. CORS Configuration
const allowedOrigins = config.cors.allowedOrigins;
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*')) {
      if (config.isProduction) {
        logger.warn(`Permitting request from origin '${origin}' under wildcard setting. Recommended to set explicit ALLOWED_ORIGINS.`);
      }
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' not permitted by CORS policy`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
};

app.use(cors(corsOptions));

// 4. Request Body Limiters (1MB limit to prevent memory exhaustion DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Request Logging (Debug in dev, omitted in prod to prevent data leakage)
app.use((req, _res, next) => {
  logger.debug(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

// 6. Direct Root Health Endpoint
app.get('/health', (_req, res) => {
  const connected = isDBConnected();
  const statusCode = connected ? 200 : (config.isProduction ? 503 : 200);
  return res.status(statusCode).json({
    status: connected ? 'healthy' : (config.isProduction ? 'unhealthy' : 'degraded'),
    database: connected ? 'connected' : 'disconnected',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 7. General API Rate Limiting & Routes
app.use('/api', generalApiLimiter, apiRouter);

// Root route
app.get('/', (_req, res) => {
  res.json({
    service: 'Inisio Greenfield Project Consultancy REST API',
    status: 'active',
    documentation: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// 8. Centralized error handling
app.use(notFound);
app.use(errorHandler);

// 9. Database Connection & Server Initialization
let server = null;

const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();
  } catch (err) {
    logger.error('Database initialization encountered an error:', err.message);
  }

  if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Inisio Backend REST API running on port ${PORT} [${config.env}]`);
      logger.info(`Health check available at: http://localhost:${PORT}/health`);
    });
  }
};

startServer();

// 10. Graceful Shutdown & Unhandled Exception Handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          await mongoose.connection.close(false);
          logger.info('MongoDB connection closed.');
        }
      } catch (err) {
        logger.error('Error closing MongoDB connection:', err.message);
      }
      process.exit(0);
    });

    // Force exit after 10 seconds if shutdown stalls
    setTimeout(() => {
      logger.error('Forcefully terminating process after 10s shutdown timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error.message, error.stack);
  gracefulShutdown('uncaughtException');
});

export default app;
