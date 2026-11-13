import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export const generateToken = (payload) => {
<<<<<<< HEAD
  const secret = config.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server');
  }
  const expiresIn = config.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, {
    expiresIn,
=======
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
  });
};

export const verifyToken = (token) => {
<<<<<<< HEAD
  const secret = config.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server');
  }
  return jwt.verify(token, secret);
=======
  return jwt.verify(token, config.jwt.secret);
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
};

export default generateToken;
