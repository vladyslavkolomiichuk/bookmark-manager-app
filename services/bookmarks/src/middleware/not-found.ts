import { ApiErrorSchema } from '@bookmark-manager/contracts';
import type { RequestHandler } from 'express';

export const notFound: RequestHandler = (
  _req,
  res
) => {
  res.status(404).json(
    ApiErrorSchema.parse({
      code: 'ROUTE_NOT_FOUND',
      message: 'Route not found.',
      details: [],
    })
  );
};
