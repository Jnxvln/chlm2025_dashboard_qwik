import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  console.log('🧪 TEST ACTION - Direct API endpoint called');
  console.log('🔍 Environment:', process.env.NODE_ENV);
  console.log('🔍 Headers:', JSON.stringify(Object.fromEntries(Object.entries(parseBody) || []), null, 2));

  try {
    // Parse the request body
    const body = await parseBody();
    console.log('🔍 Request body:', JSON.stringify(body, null, 2));

    // Test database operation
    const testDriver = await db.driver.create({
      data: {
        firstName: 'API_TEST',
        lastName: 'DIRECT_' + Date.now(),
        endDumpPayRate: 25.00,
        flatBedPayRate: 30.00,
        nonCommissionRate: 20.00,
        isActive: false
      }
    });

    console.log('✅ TEST ACTION - Driver created successfully:', testDriver.id);

    // Clean up immediately
    await db.driver.delete({
      where: { id: testDriver.id }
    });

    console.log('✅ TEST ACTION - Test driver cleaned up');

    json(200, {
      success: true,
      message: 'Direct API test successful',
      driverId: testDriver.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ TEST ACTION - Error:', error);

    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};