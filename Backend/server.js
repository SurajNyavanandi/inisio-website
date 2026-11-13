import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
<<<<<<< HEAD
import connectDB, { isDBConnected } from './config/db.js';
import { config, validateEnv } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';

// Validate environment variables on startup and fail fast if missing
validateEnv();

const app = express();
const PORT = config.PORT;

// Connect to MongoDB
connectDB().catch((err) => {
  logger.warn(`Initial MongoDB connection failed: ${err.message}`);
});

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: config.isProd ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// Compression
app.use(compression());

// CORS Configuration
const allowedOrigins = config.ALLOWED_ORIGINS;
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);

    // In non-production, allow localhost dev origins if whitelist is empty
    if (!config.isProd && allowedOrigins.length === 0) {
      if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin '${origin}' is not permitted by CORS policy.`));
    }

    // Default fallback in development
    if (!config.isProd) {
      return callback(null, true);
    }

    return callback(new Error(`Origin '${origin}' is not allowed by CORS.`));
=======
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
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

<<<<<<< HEAD
// Body parsers with 1MB payload limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging (sanitized, non-production verbose)
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// Root Health Check Route checking database readiness (200 / 503)
app.get('/health', (req, res) => {
  const dbConnected = isDBConnected();
  if (dbConnected) {
    return res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

  if (config.ALLOW_MEMORY_FALLBACK && !config.isProd) {
    return res.status(200).json({
      status: 'degraded',
      database: 'memory_fallback',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: 'unhealthy',
    database: 'disconnected',
=======
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
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
    timestamp: new Date().toISOString(),
  });
});

<<<<<<< HEAD
// Root service metadata route
app.get('/', (req, res) => {
  res.json({
    service: 'Inisio Greenfield Advisory & Debt Syndication API',
    status: 'active',
    health: '/health',
    version: '1.0.0',
  });
});

// Mount API Routes
app.use('/api', apiRouter);

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

// Server instance
let server = null;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Inisio Backend REST API Server is running on port ${PORT} (${config.NODE_ENV})`);
    logger.info(`Health Check: http://localhost:${PORT}/health`);
  });
}
=======
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
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92

// Graceful shutdown handler for SIGTERM and SIGINT
const handleGracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed successfully.');
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
      } catch (err) {
        logger.error(`Error closing MongoDB connection: ${err.message}`);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason, promise });
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

export default app;
