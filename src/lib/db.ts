import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in Railway environment variables');
}

console.log('🔗 Database connection status:', process.env.DATABASE_URL ? 'configured' : 'missing');

let prismaClient: PrismaClient | null = null;

try {
  if (process.env.DATABASE_URL) {
    prismaClient = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
}

export const db = prismaClient;

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = db;
