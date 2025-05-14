import { PrismaClient as BasePrismaClient } from '@prisma/client';

declare global {
  // This extends the PrismaClient to include the AIModelConfig model
  namespace PrismaClient {
    interface PrismaClient extends BasePrismaClient {}
  }
}

// This ensures this file is treated as a module
export {};
