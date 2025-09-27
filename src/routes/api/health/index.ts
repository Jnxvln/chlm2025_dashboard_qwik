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

  console.log('🔍 HEALTH CHECK - Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);
  console.log('DATABASE_URL host:', healthData.databaseUrlHost);
  console.log('Process.cwd:', process.cwd());

  try {
    console.log('🩺 Health check: Testing database connection...');

    // Test raw connection first
    console.log('🔍 Testing raw database query...');
    const rawResult = await db.$queryRaw`SELECT 1 as test`;
    console.log('✅ Raw query successful:', rawResult);

    // Test basic database connection
    console.log('🔍 Testing driver count...');
    const driverCount = await db.driver.count();
    console.log('✅ Database connected, driver count:', driverCount);

    // Test schema - this will fail if migration didn't run
    console.log('🔍 Testing schema with findFirst...');
    const firstDriver = await db.driver.findFirst({
      select: { id: true, firstName: true, dateHired: true }
    });
    console.log('✅ Schema looks good, first driver:', firstDriver);

    // Test a simple create operation (which fails in production)
    console.log('🔍 Testing simple driver creation...');
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
    console.log('✅ Test driver created:', testDriver.id);

    // Clean up test data
    await db.driver.delete({
      where: { id: testDriver.id }
    });
    console.log('✅ Test driver deleted');

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