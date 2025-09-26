import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const onGet: RequestHandler = async ({ json }) => {
  try {
    console.log('🩺 Health check: Testing database connection...');
    
    // Test basic database connection
    const driverCount = await db.driver.count();
    console.log('✅ Database connected, driver count:', driverCount);
    
    // Test schema - this will fail if migration didn't run
    const firstDriver = await db.driver.findFirst({
      select: { id: true, firstName: true, dateHired: true }
    });
    console.log('✅ Schema looks good, first driver:', firstDriver);

    json(200, {
      status: 'healthy',
      database: 'connected',
      driverCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    json(500, {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};