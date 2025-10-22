/**
 * Database connection module using Prisma ORM
 *
 * This module exports a singleton Prisma client instance that is reused
 * across the application. In development, the instance is stored globally
 * to prevent multiple clients during hot module reloading.
 *
 * @module lib/db
 */

import { PrismaClient } from '@prisma/client';

// Global storage for Prisma client to prevent multiple instances during HMR
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in Railway environment variables');
  throw new Error('DATABASE_URL must be configured');
}

let db: PrismaClient;

try {
  db = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
  });
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
  throw error;
}

export { db };

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = db;
