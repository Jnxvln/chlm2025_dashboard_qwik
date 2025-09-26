import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL must be configured');
}

console.log('🔗 Database connection:', process.env.DATABASE_URL?.substring(0, 50) + '...');

export const db =
  globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = db;
