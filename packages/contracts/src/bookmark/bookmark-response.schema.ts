import z from 'zod';

export const MetadataStatusSchema = z.enum([
  'PENDING',
  'READY',
  'FAILED',
]);

export type MetadataStatus = z.infer<
  typeof MetadataStatusSchema
>;

export const BookmarkTagResponseSchema =
  z.strictObject({
    id: z.uuid(),
    name: z.string(),
  });

export type BookmarkTagResponse = z.infer<
  typeof BookmarkTagResponseSchema
>;

export const BookmarkResponseSchema =
  z.strictObject({
    id: z.uuid(),
    title: z.string(),
    description: z.string(),
    url: z.httpUrl(),
    faviconUrl: z.url().nullable(),
    tags: z.array(BookmarkTagResponseSchema),
    viewCount: z.int().nonnegative(),
    lastVisitedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    pinned: z.boolean(),
    archivedAt: z.iso.datetime().nullable(),
    metadataStatus: MetadataStatusSchema,
  });

export type BookmarkResponse = z.infer<
  typeof BookmarkResponseSchema
>;
