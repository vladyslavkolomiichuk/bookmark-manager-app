import z from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(8002),
});

export const env = EnvSchema.parse(process.env);
