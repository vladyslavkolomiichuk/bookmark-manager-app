import z from 'zod';

export const ForgotPasswordSchema =
  z.strictObject({
    email: z
      .string()
      .trim()
      .email({ error: 'Email should be valid.' }),
  });
