import { component$ } from '@builder.io/qwik';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <section>
      <PageTitle text="Hauls" />
      <p>This is the Hauls page</p>
    </section>
  );
});
