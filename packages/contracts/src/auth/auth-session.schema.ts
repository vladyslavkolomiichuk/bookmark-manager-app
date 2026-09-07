import z from 'zod';
import { AuthenticatedUserSchema } from './authenticated-user.schema.js';

export const AuthSessionSchema = z.strictObject({
  user: AuthenticatedUserSchema,
  accessToken: z.string().nonempty(),
  tokenType: z.literal('Bearer'),
  accessTokenExpiresAt: z.iso.datetime(),
});

export type AuthSession = z.infer<
  typeof AuthSessionSchema
>;
