import z from 'zod';

const MAX_TAG_LENGTH = 32;

export const TagNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .nonempty({ error: 'Tags cannot be empty.' })
  .max(
    MAX_TAG_LENGTH,
    `Each tag must be ${MAX_TAG_LENGTH} characters or fewer.`
  );
