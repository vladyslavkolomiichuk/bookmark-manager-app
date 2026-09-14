import express, { type Router } from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';

// Func for creating an app inside index.ts
export function createApp(
  bookmarkRouter: Router
) {
  const app = express();

  app.use(express.json());

  // Health check route
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
    });
  });

  // Routes
  app.use('/bookmarks', bookmarkRouter);

  // Not found middleware
  app.use(notFound);

  // Adding error middleware
  app.use(errorHandler);

  return app;
}
