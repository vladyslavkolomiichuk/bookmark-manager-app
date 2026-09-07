import z from 'zod';

export const TagResponseSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  bookmarkCount: z.int().nonnegative(),
});
