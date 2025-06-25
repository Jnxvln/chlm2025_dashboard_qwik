import { component$ } from '@builder.io/qwik';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <section>
      <PageTitle text="Project Calculator" />
      <p>This is the Project Calculator page</p>
      <NavLink href="/calculators">Back to Calculators</NavLink>
    </section>
  );
});
