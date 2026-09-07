import z from 'zod';

enum UserRoles {
  ADMIN = 'admin',
  USER = 'user',
}

export const GatewayAuthenticatedUserSchema =
  z.strictObject({
    userId: z.uuid(),
    // roles: z.enum(UserRoles),
    // sessionId: z.uuid(),
  });

export type GatewayAuthenticatedUser = z.infer<
  typeof GatewayAuthenticatedUserSchema
>;
