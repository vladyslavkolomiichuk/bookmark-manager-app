import z from 'zod';
import { BookmarkResponseSchema } from './bookmark-response.schema.js';

export const BookmarkListResponseSchema =
  z.strictObject({
    items: z.array(BookmarkResponseSchema),
    nextCursor: z.string().nullable(),
  });

export type BookmarkListResponse = z.infer<
  typeof BookmarkListResponseSchema
>;
