import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * 404 Route Not Found Middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized Error Handling Middleware
 * Returns consistent format: { success: false, message, code }
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose disconnection / buffer timeout gracefully
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.message?.includes('buffering timed out') ||
    err.message?.includes('connect ECONNREFUSED')
  ) {
    logger.warn(`Database connection error: ${err.message}`);
    if (config.ALLOW_MEMORY_FALLBACK && !config.isProd) {
      if (req.method === 'GET') {
        return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      }
    }
    return res.status(503).json({
      success: false,
      code: 503,
      message: 'Database service is temporarily unavailable. Please try again shortly.',
    });
  }

  // Handle Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found with ID of ${err.value}`;
  }

  // Handle Mongoose duplicate key (E11000) -> 409 Conflict
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    message = `A record with this ${field} already exists. Please choose a different ${field}.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication credentials';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please log in again.';
  }

  // Server-side logging of errors
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} (${statusCode}) - ${message}`, {
      stack: err.stack,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} (${statusCode}) - ${message}`);
  }

  // In production, never return raw stack traces or internal db schema details
  const responsePayload = {
    success: false,
    code: statusCode,
    message: statusCode >= 500 && config.isProd ? 'An unexpected server error occurred.' : message,
  };

  if (!config.isProd && err.stack) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

export default {
  notFound,
  errorHandler,
};
