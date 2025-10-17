import { component$, Slot } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  return <Slot />;
});

export const head: DocumentHead = {
  title: 'Employee Access | CHLM Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Employee access portal for CHLM Dashboard application.',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, viewport-fit=cover',
    },
    {
      name: 'robots',
      content: 'noindex, nofollow', // Hide from search engines
    },
  ],
};
