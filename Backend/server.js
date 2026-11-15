import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';
import config from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendEnvPath = fs.existsSync(path.resolve(__dirname, '.env'))
  ? path.resolve(__dirname, '.env')
  : fs.existsSync(path.resolve(process.cwd(), 'Backend/.env'))
  ? path.resolve(process.cwd(), 'Backend/.env')
  : path.resolve(process.cwd(), '.env');

dotenv.config({ path: backendEnvPath });

const app = express();
const PORT = config.PORT;

// Connect to MongoDB Atlas
connectDB().catch(() => {});

// CORS Configuration
const corsOrigin = config.CORS_ORIGIN || process.env.CORS_ORIGIN || '*';

const corsOptions = {
  origin: corsOrigin === '*'
    ? '*'
    : corsOrigin.split(',').map((o) => o.trim().replace(/\/$/, '')),
  credentials: corsOrigin !== '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

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
    timestamp: new Date().toISOString(),
  });
});

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
