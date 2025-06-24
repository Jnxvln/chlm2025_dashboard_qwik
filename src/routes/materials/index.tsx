import { component$ } from '@builder.io/qwik';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <section>
      <PageTitle text='Materials' />
      <p>This is the Materials page</p>
    </section>
  );
});
