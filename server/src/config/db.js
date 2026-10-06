/**
 * config/db.js
 * Database connection layer with graceful fallback.
 *
 * Strategy:
 *   1. If MONGODB_URI is set → attempt a Mongoose connection.
 *      On success: the Mongoose models in /models/schemas/* are active.
 *      On failure: a warning is logged and the app falls back to MemoryStore.
 *
 *   2. If MONGODB_URI is NOT set → skip silently and use MemoryStore.
 *      This guarantees the platform runs out-of-the-box without MongoDB.
 *
 * The DataStore (MemoryStore) is always initialised regardless of DB status,
 * so all existing algorithm engines, services, and routes continue to work.
 */

import { env } from './env.js';

/** DB connection state exposed for health-check endpoint */
export const dbState = {
  connected: false,
  mode: 'memory', // 'memory' | 'mongodb'
  uri: null,
};

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    console.log('[DB] No MONGODB_URI set → using in-memory MemoryStore (seeded from JSON).');
    dbState.mode = 'memory';
    return false;
  }

  try {
    // Lazily import mongoose only when a URI is provided, so it stays
    // an optional dependency (not listed in package.json by default).
    const { default: mongoose } = await import('mongoose');

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    dbState.connected = true;
    dbState.mode = 'mongodb';
    dbState.uri = env.MONGODB_URI.replace(/:([^@]+)@/, ':****@'); // mask password

    console.log(`[DB] MongoDB connected → ${dbState.uri}`);
    return true;
  } catch (err) {
    console.warn(`[DB] MongoDB connection failed: ${err.message}`);
    console.warn('[DB] Falling back to in-memory MemoryStore.');
    dbState.mode = 'memory';
    return false;
  }
}
