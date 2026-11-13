import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export const generateToken = (payload) => {
  const secret = config.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server');
  }
  const expiresIn = config.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, {
    expiresIn,
  });
};

export const verifyToken = (token) => {
  const secret = config.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server');
  }
  return jwt.verify(token, secret);
};

export default generateToken;
