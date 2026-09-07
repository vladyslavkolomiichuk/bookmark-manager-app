import z from 'zod';

export const MAX_PASSWORD_LENGTH = 64;
export const MIN_PASSWORD_LENGTH = 15;
const MAX_FULL_NAME_LENGTH = 40;

export const RegisterSchema = z.strictObject({
  fullName: z
    .string()
    .trim()
    .nonempty('Full name cannot be empty.')
    .max(
      MAX_FULL_NAME_LENGTH,
      `Full name must be ${MAX_FULL_NAME_LENGTH} characters or fewer.`
    ),
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
    )
    .regex(
      /[a-z]/,
      'Password must contain at least one lowercase letter'
    )
    .regex(
      /[A-Z]/,
      'Password must contain at least one uppercase letter'
    )
    .regex(
      /[0-9]/,
      'Password must contain at least one number'
    )
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});
