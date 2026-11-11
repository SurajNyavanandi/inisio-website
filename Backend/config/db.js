import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

// Disable buffering so queries fail-fast or fallback immediately instead of hanging
mongoose.set('bufferCommands', false);

let cachedConnection = null;
let connectingPromise = null;
let lastConnectionAttempt = 0;
const RECONNECT_COOLDOWN_MS = 10000; // Wait 10s before retrying failed connection

export const isDBConnected = () => {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
};

export const connectDB = async () => {
  // Return active connection if ready
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    cachedConnection = mongoose.connection;
    return cachedConnection;
  }

  // If a connection attempt is already in flight, return that promise
  if (connectingPromise) {
    return connectingPromise;
  }

  const uri = config.databaseUri;

  if (!uri) {
    if (config.isProduction) {
      logger.error('CRITICAL: MongoDB URI not provided in production environment.');
    }
    return null;
  }

  // Throttle reconnect attempts to prevent connection spamming
  const now = Date.now();
  if (now - lastConnectionAttempt < RECONNECT_COOLDOWN_MS && mongoose.connection.readyState === 0) {
    return null;
  }

  lastConnectionAttempt = now;

  connectingPromise = (async () => {
    try {
      const conn = await mongoose.connect(uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 20000,
        connectTimeoutMS: 3000,
      });

      cachedConnection = conn;
      logger.info(`MongoDB Connected Successfully: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      logger.warn(`MongoDB Connection not established (${error.message}). Resilient storage active.`);
      return null;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
};

export const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

export default connectDB;

