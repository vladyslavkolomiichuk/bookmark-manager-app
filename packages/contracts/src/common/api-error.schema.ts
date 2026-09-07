import z from 'zod';

const DetailSchema = z.strictObject({
  path: z.string(),
  message: z.string(),
});

export const ApiErrorSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
  details: z.array(DetailSchema).default([]),
});

export type ApiError = z.infer<
  typeof ApiErrorSchema
>;
