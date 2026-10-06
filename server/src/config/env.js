/**
 * config/env.js
 * Centralised environment variable access and validation.
 * Fails fast at boot if required variables are missing or invalid.
 */

import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name, fallback) {
  const val = process.env[name];
  if (val !== undefined && val !== '') return val;
  if (fallback !== undefined) return fallback;
  throw new Error(`[config/env] Required environment variable "${name}" is missing. Set it in server/.env`);
}

export const env = {
  /** HTTP server port */
  PORT: parseInt(requireEnv('PORT', '5000'), 10),

  /** 'development' | 'production' | 'test' */
  NODE_ENV: requireEnv('NODE_ENV', 'development'),

  /** Whether we're running in development */
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  /** Whether we're running in production */
  isProd: process.env.NODE_ENV === 'production',

  /**
   * Optional MongoDB URI.
   * When absent the app falls back to the in-memory MemoryStore
   * seeded from JSON files — no DB required to run the project.
   */
  MONGODB_URI: process.env.MONGODB_URI || null,

  /** Comma-separated CORS allowed origins */
  CORS_ORIGIN: requireEnv('CORS_ORIGIN', '*'),

  /** Logging verbosity level */
  LOG_LEVEL: requireEnv('LOG_LEVEL', 'info'),
};
