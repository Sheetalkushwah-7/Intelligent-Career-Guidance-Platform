/**
 * app.js
 * Express server entry point.
 */

import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDatabase, dbState } from './config/db.js';
import { registerModels } from './models/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/api.js';

const app = express();

const corsOrigin = env.CORS_ORIGIN === '*'
  ? '*'
  : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

app.use((req, res, next) => {
  if (env.LOG_LEVEL !== 'silent') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Intelligent Career Guidance Platform API is running',
    db: {
      mode: dbState.mode,
      connected: dbState.connected,
      uri: dbState.uri,
    },
    env: env.NODE_ENV,
  });
});

app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDatabase();
  if (dbState.connected) {
    await registerModels();
  }

  app.listen(env.PORT, () => {
    console.log(`Server listening on http://localhost:${env.PORT}`);
    console.log(`Health check: http://localhost:${env.PORT}/health`);
    console.log(`Data layer: ${dbState.mode}`);
  });
}

start().catch((err) => {
  console.error('[Startup] Failed to start server:', err);
  process.exit(1);
});

export default app;
