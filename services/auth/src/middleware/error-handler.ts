import { AppError } from '@bookmark-manager/common';
import { ApiErrorSchema } from '@bookmark-manager/contracts';
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  // Checking requests error from zod
  if (error instanceof ZodError) {
    const body = ApiErrorSchema.parse({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });

    res.status(400).json(body);
    return;
  }

  // Checking my own errors
  if (error instanceof AppError) {
    const body = ApiErrorSchema.parse({
      code: error.code,
      message: error.message,
      details: error.details,
    });

    res.status(error.statusCode).json(body);
    return;
  }

  // // Logging unexpected error
  // req.log.error(
  //   {
  //     err: error,
  //     requestId: req.requestId,
  //   },
  //   'Unhandled request error'
  // );
  console.log(error);

  // Unexpected error
  const body = ApiErrorSchema.parse({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
    details: [],
  });

  res.status(500).json(body);
};
