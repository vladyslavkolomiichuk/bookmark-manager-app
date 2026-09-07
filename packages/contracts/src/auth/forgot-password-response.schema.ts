import z from 'zod';

export const ForgotPasswordResponseSchema =
  z.strictObject({
    message: z.literal(
      'If an account exists for that email address, reset instructions have been sent.'
    ),
  });

export type ForgotPasswordResponse = z.infer<
  typeof ForgotPasswordResponseSchema
>;
