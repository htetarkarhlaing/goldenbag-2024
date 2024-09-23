import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';

export const extendedPrismaClient = new PrismaClient({
  log: ['info', 'error'],
}).$extends(readReplicas({ url: process.env.DATABASE_URL_REPLICA as string }));

export type ExtendedPrismaClient = typeof extendedPrismaClient;
