import { PrismaClient } from '@prisma/client';

// This is a workaround for TypeScript errors with the Prisma client
// It allows us to use the AIModelConfig model without TypeScript errors
declare module '@prisma/client' {
  interface PrismaClient {
    AIModelConfig: any;
  }
}

export {};
