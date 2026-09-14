import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../database/client.js';
import { jwt } from 'better-auth/plugins';
import { env } from '../config/env.js';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/auth',
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: { generateId: 'uuid' },
  },
  plugins: [
    jwt({
      jwt: {
        issuer: env.BETTER_AUTH_URL,
        audience: 'bookmarks-service',
        expirationTime: '5m',
        definePayload: () => ({
          tokenUse: 'internal-user-access',
        }),
      },
    }),
  ],
});
