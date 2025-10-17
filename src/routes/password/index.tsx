import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';
import { createAuthToken } from '~/utils/auth';

export const usePasswordAction = routeAction$(
  async (values, { cookie, redirect, url }) => {
    const correctPassword = process.env.EMPLOYEE_PASSWORD || 'CHLM2025!';

    if (values.password === correctPassword) {
      // Create a signed token
      const authToken = createAuthToken();

      // Set the auth cookie on the server
      cookie.set('chlm_auth', authToken, {
        path: '/',
        maxAge: 86400, // 1 day
        httpOnly: true, // Prevent client-side access
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
      });

      // Get redirect URL from query params
      const redirectTo = url.searchParams.get('redirect') || '/';

      throw redirect(302, redirectTo);
    }

    return {
      success: false,
      fieldErrors: {
        password: 'Incorrect password',
      },
    };
  },
  zod$({
    password: z.string().min(1, 'Password is required'),
  }),
);

export default component$(() => {
  const passwordAction = usePasswordAction();

  return (
    <div class="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-purple-950">
      <div class="w-full max-w-md mx-4 space-y-8 rounded-xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        <div class="text-center">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-purple-400">
            CHLM Dashboard
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Employee Access Required
          </p>
        </div>

        <Form action={passwordAction}>
          <div class="space-y-6">
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                placeholder="Enter employee password"
              />
              {passwordAction.value?.fieldErrors?.password && (
                <p class="mt-2 text-sm text-red-600 dark:text-red-400">
                  {passwordAction.value.fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              class="w-full rounded-md bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:from-teal-500 dark:to-teal-600 dark:hover:from-teal-600 dark:hover:to-teal-700"
              disabled={passwordAction.isRunning}
            >
              {passwordAction.isRunning ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </div>
        </Form>

        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            For CHLM employees only
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Employee Access | CHLM Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Employee access portal for CHLM Dashboard application.',
    },
  ],
};
