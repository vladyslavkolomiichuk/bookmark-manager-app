import z from 'zod';

export const TagResponseSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  bookmarkCount: z.int().nonnegative(),
});

export type TagResponse = z.infer<
  typeof TagResponseSchema
>;
