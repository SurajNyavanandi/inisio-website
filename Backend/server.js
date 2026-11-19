import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import mongoose from 'mongoose';
import connectDB, { isDBConnected } from './config/db.js';
import apiRouter from './routes/index.js';
import visitorRoutes from './routes/visitorRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';
import config from './config/env.js';
import { getEmailSenderStatus } from './utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendEnvPath = fs.existsSync(path.resolve(__dirname, '.env'))
  ? path.resolve(__dirname, '.env')
  : fs.existsSync(path.resolve(process.cwd(), 'Backend/.env'))
  ? path.resolve(process.cwd(), 'Backend/.env')
  : path.resolve(process.cwd(), '.env');

dotenv.config({ path: backendEnvPath });

const app = express();
app.set('trust proxy', 1);
const PORT = config.PORT;

// Connect to MongoDB Atlas
connectDB().catch(() => {});

// CORS Configuration
const corsOrigin = config.CORS_ORIGIN || process.env.CORS_ORIGIN || '*';

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or wildcard
    if (!origin || corsOrigin === '*') return callback(null, true);
    const origins = corsOrigin.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
    if (origins.includes(origin) || origins.includes('*') || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
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

// Log Resend sender readiness once on startup (non-blocking)
getEmailSenderStatus()
  .then((status) => {
    if (status.configured) {
      logger.info(
        `[Resend] Startup sender: '${status.activeSender}' | Verified domain: ${status.verifiedDomain || 'pending verification'}`
      );
    }
  })
  .catch(() => {});

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

  if (config.ALLOW_MEMORY_FALLBACK) {
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

// Mount API Routes
app.use('/api', apiRouter);
app.use('/api/visitors', visitorRoutes);
app.use('/visitors', visitorRoutes);

// Frontend serving paths
const frontendRootPath = path.resolve(__dirname, '../Frontend');
const frontendDistPath = path.resolve(__dirname, '../Frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

function mountStaticFrontend() {
  if (fs.existsSync(frontendDistPath)) {
    app.use(
      express.static(frontendDistPath, {
        setHeaders: (res, filePath) => {
          if (path.basename(filePath) === 'index.html') {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api') ||
        req.path === '/health' ||
        req.path.startsWith('/visitors') ||
        req.path.startsWith('/assets/') ||
        /\.[a-z0-9]+$/i.test(req.path)
      ) {
        return next();
      }
      if (fs.existsSync(frontendIndexPath)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.sendFile(frontendIndexPath);
      }
      return next();
    });
  } else {
    app.get('/', (req, res) => {
      res.json({
        service: 'Inisio Greenfield Advisory & Debt Syndication API',
        status: 'active',
        health: '/health',
        version: '1.0.0',
      });
    });
  }
}

// Server instances
let server = null;
let viteServer = null;

async function startServer() {
  let mountedVite = false;

  if (!config.isProduction) {
    try {
      const viteEntryCandidates = [
        path.join(frontendRootPath, 'node_modules/vite/dist/node/index.js'),
        path.resolve(__dirname, '../node_modules/vite/dist/node/index.js'),
      ];
      const viteEntry = viteEntryCandidates.find((p) => fs.existsSync(p));

      if (viteEntry) {
        const { createServer: createViteServer } = await import(pathToFileURL(viteEntry).href);
        viteServer = await createViteServer({
          root: frontendRootPath,
          configFile: path.join(frontendRootPath, 'vite.config.ts'),
          server: {
            middlewareMode: true,
            hmr: false,
            allowedHosts: true,
          },
          appType: 'spa',
        });

        app.use((req, res, next) => {
          if (req.path.startsWith('/api') || req.path === '/health' || req.path.startsWith('/visitors')) {
            return next();
          }
          return viteServer.middlewares(req, res, next);
        });

        mountedVite = true;
        logger.info('Vite development middleware mounted on Express');
      }
    } catch (err) {
      logger.warn(`Vite dev middleware unavailable (${err.message}); falling back to static Frontend/dist`);
    }
  }

  if (!mountedVite) {
    mountStaticFrontend();
  }

  // Centralized error handling (must be mounted after all routes and Vite middleware)
  app.use(notFound);
  app.use(errorHandler);

  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Inisio Backend REST API Server is running on port ${PORT} (${config.NODE_ENV})`);
    logger.info(`Health Check: http://localhost:${PORT}/health`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error(`Failed to start server: ${err.message}`, { stack: err.stack });
    process.exit(1);
  });
} else {
  mountStaticFrontend();
  app.use(notFound);
  app.use(errorHandler);
}

// Graceful shutdown handler for SIGTERM and SIGINT
const handleGracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  if (viteServer) {
    try {
      await viteServer.close();
    } catch {}
  }
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
