import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateToken = (payload) => {
  const secret = config.JWT_SECRET;
  const expiresIn = config.JWT_EXPIRES_IN;

  return jwt.sign(payload, secret, {
    expiresIn,
  });
};

export const verifyToken = (token) => {
  const secret = config.JWT_SECRET;
  return jwt.verify(token, secret);
};

export default generateToken;
