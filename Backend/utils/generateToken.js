import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Issue a short-lived JWT access token carrying tokenVersion for immediate revocation support.
 */
export const generateToken = (payload) => {
  const tokenPayload = {
    ...payload,
    tokenVersion: Number(payload?.tokenVersion || 0),
  };
  return jwt.sign(tokenPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN || '15m',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

/**
 * Issue a rotating refresh token stored in an HttpOnly cookie and hashed in DB.
 */
export const generateRefreshToken = (payload) => {
  const jti = crypto.randomUUID();
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      tokenVersion: Number(payload?.tokenVersion || 0),
      jti,
    },
    config.JWT_REFRESH_SECRET,
    {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN || '7d',
    }
  );
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
};

export const hashRefreshToken = (token) => {
  return crypto
    .createHmac('sha256', config.JWT_REFRESH_SECRET)
    .update(String(token || ''))
    .digest('hex');
};

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export default generateToken;
