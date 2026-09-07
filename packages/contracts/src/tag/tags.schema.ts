import z from 'zod';
import { TagNameSchema } from './tag-name.schema.js';

const MAX_TAGS_NUMBER = 10;

export const TagsSchema = z
  .array(TagNameSchema)
  .transform((val) => [...new Set(val)])
  .refine(
    (val) => val.length <= MAX_TAGS_NUMBER,
    {
      message: `Choose at most ${MAX_TAGS_NUMBER} tags.`,
    }
  )
  .default([]);
