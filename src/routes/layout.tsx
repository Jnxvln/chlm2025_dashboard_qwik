import { component$, Slot } from '@builder.io/qwik';
import { DocumentHead } from '@builder.io/qwik-city';
import { Nav } from '~/components/Nav';

export default component$(() => {
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
