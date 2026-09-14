import z from 'zod';

export const InternalUserJwtClaimsSchema =
  z.strictObject({
    sub: z.uuid(), // user UUID
    iss: z.string(), // token issuer
    aud: z.string(), // intended service audience
    iat: z.number().int().nonnegative(), // issued-at
    exp: z.number().int().nonnegative(),
    jti: z.string().optional(), // optional unique token ID
    tokenUse: z.literal('internal-user-access'),
  });

export type InternalUserJwtClaims = z.infer<
  typeof InternalUserJwtClaimsSchema
>;
