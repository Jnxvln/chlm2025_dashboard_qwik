import { component$, Slot } from '@builder.io/qwik';
import { type DocumentHead, type RequestHandler, routeAction$, useLocation } from '@builder.io/qwik-city';
import { Nav } from '~/components/Nav';
import { verifyAuthToken } from '~/utils/auth';

export const useLogoutAction = routeAction$(async (data, { cookie, redirect }) => {
  // Clear the auth cookie by setting it to expire immediately
  cookie.set('chlm_auth', '', {
    path: '/',
    maxAge: 0,
  });

  // Redirect to password page
  throw redirect(302, '/password');
});

export const onRequest: RequestHandler = async ({ cookie, url, redirect }) => {
  // Allow access to password page without authentication
  if (url.pathname.startsWith('/password')) {
    return;
  }

  // Check for auth cookie
  const authToken = cookie.get('chlm_auth')?.value;

  // If no auth token or invalid token, redirect to password page
  if (!authToken || !verifyAuthToken(authToken)) {
    throw redirect(302, `/password?redirect=${encodeURIComponent(url.pathname + url.search)}`);
  }
};

export default component$(() => {
  const location = useLocation();
  const isPasswordPage = location.url.pathname.startsWith('/password');

  // For password page, render only the slot without nav or container
  if (isPasswordPage) {
    return <Slot />;
  }

  // For all other pages, render with nav and container
  return (
    <>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            main {
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
      <div class="no-print">
        <Nav />
      </div>
      <main class="max-w-6xl mx-auto p-6">
        <Slot />
      </main>
    </>
  );
});

export const head: DocumentHead = {
  title: 'CHLM Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Internal company dashboard for CHLM employees',
    },
  ],
  links: [
    // Original default
    // { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },

    { rel: 'icon', href: '/favicon.png', type: 'image/png' },
    // optional sizes for high-res displays
    // { rel: 'icon', href: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
    // { rel: 'icon', href: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
  ],
};
