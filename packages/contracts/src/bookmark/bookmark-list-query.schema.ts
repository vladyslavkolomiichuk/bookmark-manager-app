import z from 'zod';
import { TagsSchema } from '../tag/tags.schema.js';

export const BookmarkStatusSchema = z.enum([
  'active',
  'archived',
  'all',
]);

export type BookmarkStatus = z.infer<
  typeof BookmarkStatusSchema
>;

export const BookmarkSortSchema = z.enum([
  'recently-added',
  'recently-visited',
  'most-visited',
]);

export type BookmarkSort = z.infer<
  typeof BookmarkSortSchema
>;

const QueryBooleanSchema = z.union([
  z.boolean(),
  z
    .enum(['true', 'false'])
    .transform((value) => value === 'true'),
]);

const QueryTagsSchema = z.preprocess(
  (value) =>
    typeof value === 'string' ? [value] : value,
  TagsSchema.removeDefault().optional()
);

export const BookmarkListQuerySchema =
  z.strictObject({
    search: z.string().trim().optional(),
    tags: QueryTagsSchema,
    status:
      BookmarkStatusSchema.default('active'),
    pinned: QueryBooleanSchema.optional(),
    sort: BookmarkSortSchema.default(
      'recently-added'
    ),
    cursor: z.string().min(1).optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
  });

export type BookmarkListQuery = z.infer<
  typeof BookmarkListQuerySchema
>;
