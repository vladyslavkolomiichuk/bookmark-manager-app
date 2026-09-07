import z from 'zod';
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from './register.schema.js';

export const MAX_TOKEN_LENGTH = 100;

export const ResetPasswordSchema = z
  .strictObject({
    token: z
      .string()
      .nonempty()
      .max(MAX_TOKEN_LENGTH),
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
    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );
