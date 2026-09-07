import z from 'zod';

export const BookmarkIdSchema = z.strictObject({
  id: z.uuid(),
});

export type BookmarkId = z.infer<
  typeof BookmarkIdSchema
>;
