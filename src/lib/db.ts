import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in Railway environment variables');
  throw new Error('DATABASE_URL must be configured');
}

console.log('🔗 Database connection:', process.env.DATABASE_URL.substring(0, 50) + '...');

let db: PrismaClient;

try {
  db = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
  });
  console.log('✅ Prisma client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
  throw error;
}

export { db };

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = db;
