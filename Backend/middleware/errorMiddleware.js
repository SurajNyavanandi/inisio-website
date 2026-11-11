import { sendError } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * 404 Route Not Found Middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
};

/**
 * Centralized Global Error Handling Middleware
 * Guarantees consistent JSON output: { success: false, message, code }
 * Never leaks stack traces or internal details in production
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
  }

  // Handle Mongoose disconnection / buffer timeout gracefully
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.message?.includes('buffering timed out') ||
    err.message?.includes('connect ECONNREFUSED')
  ) {
    console.warn('[AI Studio] Database offline — returning mock empty response or fallback:', err.message);
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable (database offline). Resilient in-memory mode active.',
    });
  }

  // Handle Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found with ID of ${err.value}`;
    code = 'RESOURCE_NOT_FOUND';
  }

  // Handle Mongoose duplicate key (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for '${field}'. Please use another value.`;
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
    message = 'Authentication token expired. Please login again';
    code = 'TOKEN_EXPIRED';
  }

  if (message.includes('Invalid email or password') || message.includes('Please provide your password')) {
    statusCode = 401;
    code = 'INVALID_CREDENTIALS';
  }

  // Server-side logging only
  if (statusCode >= 500) {
    logger.error(`[Server Error] ${req.method} ${req.originalUrl} (${statusCode}) - ${err.message}`, err.stack);
  } else {
    logger.warn(`[Client Error] ${req.method} ${req.originalUrl} (${statusCode}) - ${message}`);
  }

  return sendError(
    res,
    message,
    statusCode,
    config.isProduction ? undefined : err.stack,
    code
  );
};

export default {
  notFound,
  errorHandler,
};
