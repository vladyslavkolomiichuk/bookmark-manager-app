import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export const validateQuery = <TQuery>(
  parser: ZodType<TQuery>
): RequestHandler => {
  return (req, _res, next) => {
    const query = parser.parse(req.query);

    req.validated = {
      ...req.validated,
      query,
    };

    next();
  };
};
