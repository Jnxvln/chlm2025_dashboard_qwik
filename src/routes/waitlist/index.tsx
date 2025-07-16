import { component$ } from '@builder.io/qwik';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <section class="container mx-auto p-6">
      <PageTitle text="Waiting List" />
      <p>This is the Waiting List page</p>
    </section>
  );
});
