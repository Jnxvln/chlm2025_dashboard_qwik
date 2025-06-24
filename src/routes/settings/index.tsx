import { component$ } from '@builder.io/qwik';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <section>
      <PageTitle text='Settings' />
      <p>This is the Settings page</p>
    </section>
  );
});
