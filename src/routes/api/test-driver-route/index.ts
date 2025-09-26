import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ json }) => {
  try {
    console.log('🧪 Testing if we can load driver creation route components...');
    
    // This will help us see if the issue is in route loading vs form submission
    json(200, {
      status: 'success',
      message: 'Driver route test endpoint works',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Driver route test failed:', error);
    json(500, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};