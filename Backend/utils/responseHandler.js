import config from '../config/env.js';

/**
 * Standardized API Response Helpers
 */

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const sendError = (
  res,
  message = 'An error occurred',
  statusCode = 500,
  errors = null,
  code = 'ERROR'
) => {
  const isProd = config.isProduction || config.isProd;
  const payload = {
    success: false,
    code: statusCode,
    errorCode: code,
    message: isProd && statusCode >= 500 ? 'Internal Server Error' : message,
    timestamp: new Date().toISOString(),
  };
  if (!isProd && errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};

export default {
  sendSuccess,
  sendError,
};
