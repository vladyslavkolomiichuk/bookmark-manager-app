import z from 'zod';
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from './register.schema.js';

export const LoginSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .email({ error: 'Email should be valid.' }),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    )
    .max(
      MAX_PASSWORD_LENGTH,
      `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`
    ),
});
