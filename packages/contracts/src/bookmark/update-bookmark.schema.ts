import z from 'zod';
import { TagsSchema } from '../tag/tags.schema.js';

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 280;

export const UpdateBookmarkSchema = z
  .strictObject({
    url: z
      .string()
      .trim()
      .min(1, 'Enter website address.')
      .pipe(
        z.httpUrl({
          error:
            'Use a full URL starting with http:// or https://.',
        })
      )
      .optional(),
    title: z
      .string()
      .trim()
      .max(
        MAX_TITLE_LENGTH,
        `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`
      )
      .optional(),
    description: z
      .string()
      .trim()
      .max(
        MAX_DESCRIPTION_LENGTH,
        `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`
      )
      .optional(),
    tags: TagsSchema.removeDefault().optional(),
  })
  .refine(
    (update) => Object.keys(update).length > 0,
    {
      message:
        'Provide at least one field to update.',
    }
  );

export type UpdateBookmark = z.infer<
  typeof UpdateBookmarkSchema
>;
