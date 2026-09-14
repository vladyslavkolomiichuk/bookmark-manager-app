import type { RequestHandler } from 'express';

export const verifyInternalUserJwt: RequestHandler =
  (_req, res, _next) => {
    res.status(503).json({
      code: 'AUTH_NOT_CONFIGURED',
      message:
        'Internal authentication is not available.',
      details: [],
    });
  };
