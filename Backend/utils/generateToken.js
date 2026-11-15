import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendEnvPath = fs.existsSync(path.resolve(__dirname, '../.env'))
  ? path.resolve(__dirname, '../.env')
  : fs.existsSync(path.resolve(process.cwd(), 'Backend/.env'))
  ? path.resolve(process.cwd(), 'Backend/.env')
  : path.resolve(process.cwd(), '.env');

dotenv.config({ path: backendEnvPath });

export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'inisio_secure_jwt_secret_token_2026_greenfield';
  const expiresIn = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d';

  return jwt.sign(payload, secret, {
    expiresIn,
  });
};

export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'inisio_secure_jwt_secret_token_2026_greenfield';
  return jwt.verify(token, secret);
};

export default generateToken;
