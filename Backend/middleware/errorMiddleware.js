import { sendError } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * 404 Route Not Found Middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
};

/**
 * Centralized Error Handling Middleware
 * Returns consistent format: { success: false, message, code }
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle Mongoose disconnection / buffer timeout gracefully
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.message?.includes('buffering timed out') ||
    err.message?.includes('connect ECONNREFUSED')
  ) {
    statusCode = 503;
    message = 'Service temporarily unavailable. Database connection offline.';
    code = 'DATABASE_OFFLINE';
    logger.warn(`Database connection error: ${err.message}`);
    if (config.ALLOW_MEMORY_FALLBACK && !config.isProd) {
      if (req.method === 'GET') {
        return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      }
    }
  }

  // Handle Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found with ID of ${err.value}`;
    code = 'RESOURCE_NOT_FOUND';
  }

  // Handle Mongoose duplicate key (E11000) -> 409 Conflict
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    message = `A record with this ${field} already exists. Please choose a different ${field}.`;
    code = 'DUPLICATE_KEY';
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    code = 'VALIDATION_ERROR';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please log in again.';
    code = 'TOKEN_EXPIRED';
  }

  if (message.includes('Invalid email or password') || message.includes('Please provide your password')) {
    statusCode = 401;
    code = 'INVALID_CREDENTIALS';
  }

  // Server-side logging of errors
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} (${statusCode}) - ${message}`, {
      stack: err.stack,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} (${statusCode}) - ${message}`);
  }

  return sendError(
    res,
    message,
    statusCode,
    config.isProd ? undefined : err.stack,
    code
  );
};

export default {
  notFound,
  errorHandler,
};
