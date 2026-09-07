import z from 'zod';

export const SetPinnedSchema = z.strictObject({
  pinned: z.boolean(),
});

export type SetPinned = z.infer<
  typeof SetPinnedSchema
>;

export const SetArchivedSchema = z.strictObject({
  archived: z.boolean(),
});

export type SetArchived = z.infer<
  typeof SetArchivedSchema
>;
