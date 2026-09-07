import z from 'zod';

export const AuthenticatedUserSchema =
  z.strictObject({
    id: z.uuid(),
    fullName: z.string(),
    email: z.email(),
  });

export type AuthenticatedUser = z.infer<
  typeof AuthenticatedUserSchema
>;
