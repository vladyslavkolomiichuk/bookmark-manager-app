import express from 'express';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import { auth } from './libs/auth.js';
import { toNodeHandler } from 'better-auth/node';

export function createApp() {
  const app = express();

  app.all('/auth/*splat', toNodeHandler(auth));

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
    });
  });

  app.use(notFound);

  app.use(errorHandler);

  return app;
}
