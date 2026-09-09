import type {
  Prisma,
  PrismaClient,
} from '../generate/prisma/client.js';

// Type to get ability of both single and transaction ways of working with db
export type DbClient =
  PrismaClient | Prisma.TransactionClient;
