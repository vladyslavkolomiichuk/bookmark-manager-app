import z from 'zod';

export const DeleteBookmarkSchema =
  z.strictObject({
    deleteUnusedTags: z.boolean(),
  });

export type DeleteBookmark = z.infer<
  typeof DeleteBookmarkSchema
>;

export const UnusedTagSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
});

export type UnusedTag = z.infer<
  typeof UnusedTagSchema
>;

export const DeleteBookmarkPreviewResponseSchema =
  z.strictObject({
    unusedTags: z.array(UnusedTagSchema),
  });

export type DeleteBookmarkPreviewResponse =
  z.infer<
    typeof DeleteBookmarkPreviewResponseSchema
  >;
