import { component$ } from '@builder.io/qwik';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <section class="container mx-auto p-6">
      <PageTitle text="Hauls" />
      <p>This is the Hauls page</p>
    </section>
  );
});
