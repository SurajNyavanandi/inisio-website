import config from '../config/env.js';

/**
 * Standardized API Response Helpers
 */

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
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
  const isProd = config.isProduction;
  return res.status(statusCode).json({
    success: false,
    message: isProd && statusCode >= 500 ? 'Internal Server Error' : message,
    code,
    ...(!isProd && errors ? { errors } : {}),
    timestamp: new Date().toISOString(),
  });
};

export default {
  sendSuccess,
  sendError,
};
