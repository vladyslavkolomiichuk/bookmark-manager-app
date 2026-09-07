import z from 'zod';

export const PaginationSchema = z.strictObject({
  cursor: z.string().min(1).optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});
