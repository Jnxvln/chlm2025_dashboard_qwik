import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">POST Request Test</h1>

      <div class="space-y-4">
        <div class="card p-4">
          <h2 class="text-lg font-semibold mb-2">Test 1: Direct API POST</h2>
          <button
            class="btn btn-primary"
            onClick$={async () => {
              try {
                console.log('🧪 Testing direct API POST...');
                const response = await fetch('/api/test-action', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    test: 'direct-api-call',
                    timestamp: new Date().toISOString()
                  })
                });

                console.log('📊 Response status:', response.status);
                console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

                if (response.ok) {
                  const data = await response.json();
                  console.log('✅ Direct API POST successful:', data);
                  alert('✅ Direct API POST worked: ' + JSON.stringify(data));
                } else {
                  console.error('❌ Direct API POST failed:', response.status, response.statusText);
                  alert('❌ Direct API POST failed: ' + response.status + ' ' + response.statusText);
                }
              } catch (error) {
                console.error('❌ Direct API POST error:', error);
                alert('❌ Direct API POST error: ' + error);
              }
            }}
          >
            Test Direct API POST
          </button>
        </div>

        <div class="card p-4">
          <h2 class="text-lg font-semibold mb-2">Test 2: Simple Form POST</h2>
          <form
            method="POST"
            action="/api/test-action"
            onSubmit$={() => {
              console.log('📝 Form submitted via traditional POST');
            }}
          >
            <input type="hidden" name="test" value="form-submission" />
            <input type="hidden" name="timestamp" value={new Date().toISOString()} />
            <button type="submit" class="btn btn-secondary">
              Test Form POST
            </button>
          </form>
        </div>

        <div class="card p-4">
          <h2 class="text-lg font-semibold mb-2">Test 3: Check Network</h2>
          <p class="text-sm text-gray-600 mb-2">
            Open browser dev tools → Network tab before testing
          </p>
          <button
            class="btn btn-ghost"
            onClick$={() => {
              console.log('🌐 Check your Network tab for blocked requests');
              alert('🌐 Check your Network tab - look for any blocked or failed POST requests');
            }}
          >
            Check Instructions
          </button>
        </div>
      </div>
    </div>
  );
});