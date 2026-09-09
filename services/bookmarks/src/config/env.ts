import { z } from 'zod';

// Schema for getting auto env variables
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(4101),
  DATABASE_URL: z.string().min(1),
});

export const env = EnvSchema.parse(process.env);
