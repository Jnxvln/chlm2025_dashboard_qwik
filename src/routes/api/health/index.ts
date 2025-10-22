import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const onGet: RequestHandler = async ({ json }) => {
  const healthData = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    databaseUrlHost: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).host : 'MISSING',
  };

  try {
    // Test raw connection first
    await db.$queryRaw`SELECT 1 as test`;

    // Test basic database connection
    const driverCount = await db.driver.count();

    // Test schema - this will fail if migration didn't run
    await db.driver.findFirst({
      select: { id: true, firstName: true, dateHired: true }
    });

    // Test a simple create operation (which fails in production)
    const testDriver = await db.driver.create({
      data: {
        firstName: 'TEST',
        lastName: 'HEALTH_CHECK',
        endDumpPayRate: 0,
        flatBedPayRate: 0,
        nonCommissionRate: 0,
        isActive: false
      }
    });

    // Clean up test data
    await db.driver.delete({
      where: { id: testDriver.id }
    });

    json(200, {
      status: 'healthy',
      database: 'connected',
      driverCount,
      testCreateSuccess: true,
      ...healthData
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : 'No stack trace',
      code: (error as any)?.code || 'No code',
      meta: (error as any)?.meta || 'No meta'
    });

    json(500, {
      status: 'unhealthy',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorCode: (error as any)?.code || null,
      ...healthData
    });
  }
};