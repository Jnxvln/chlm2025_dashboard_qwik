import { component$ } from '@builder.io/qwik';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <section>
      <PageTitle text="Vendors" />
      <p>This is the Vendors page</p>
    </section>
  );
});
