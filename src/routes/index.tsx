import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import PageSubtitle from '~/components/PageSubtitle';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <>
      <PageTitle text='Dashboard' />

      {/* Notices Section */}
      <section class='mb-4'>
        <header class='mt-4 p-4 bg-gray-100 rounded-lg rounded-b-none'>
          <PageSubtitle text='Notices' />
        </header>

        <div class='p-4 rounded-lg rounded-t-none border-2 border-neutral-200 border-t-0'>
          <ul>
            <li>
              6/23/2025: Waiting on Cherry Blend to come in for Larry Williams
              (see waitlist)
            </li>
            <li>
              6/21/2025: John Doe did pay his outstanding balance (okay to sign
              again.)
            </li>
            <li>6/20/2025: NO delieveries for Kelly this Friday the 25th.</li>
          </ul>
        </div>
      </section>

      {/* Waitlist Section (Oldest?) */}
      <section class='mb-4'>
        <header class='p-4 bg-gray-100 rounded-lg rounded-b-none'>
          <PageSubtitle text='Waitlist' />
          <div class='mt-2'>
            <p>The oldest top 10 entries listed here?</p>
          </div>
        </header>

        <div class='p-4 rounded-lg rounded-t-none border-2 border-neutral-200 border-t-0'>
          <ul>
            <li>
              5/22/2025: Larry Williams | 2PL 4x4 Cherry Blend | 555-627-1255
            </li>
            <li>
              5/30/2025: Tina Lybeck | 1PL Med Mossy Boulders | 555-631-2479
            </li>
            <li>6/16/2025: Connor Lebobby | 4yds Red Mulch | 555-473-6448</li>
            <li>
              6/20/2025: Mila O'Reilly | ?yds Oversize Blue/White | 555-497-1489
            </li>
          </ul>
        </div>
      </section>
    </>
  );
});

export const head: DocumentHead = {
  title: 'Welcome to Qwik',
  meta: [
    {
      name: 'description',
      content: 'Qwik site description',
    },
  ],
};
