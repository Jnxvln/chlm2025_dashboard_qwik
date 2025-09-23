import { component$, Slot } from '@builder.io/qwik';
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
