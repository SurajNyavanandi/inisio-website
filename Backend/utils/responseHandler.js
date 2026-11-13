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

<<<<<<< HEAD
export const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    code: statusCode,
    message,
=======
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
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
    timestamp: new Date().toISOString(),
  };
  if (errors !== null && errors !== undefined) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};

export default {
  sendSuccess,
  sendError,
};
