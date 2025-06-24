import { component$ } from '@builder.io/qwik';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <section>
      <PageTitle text='Calculators' />
      <p class='mb-2'>This is the Calculators page</p>
      <nav class='flex flex-col'>
        <NavLink href='/calculators/cost'>
          Cost Calculator (Cubic Yards)
        </NavLink>
        <NavLink href='/calculators/project'>
          Project Calculator (Cubic Yards)
        </NavLink>
      </nav>
    </section>
  );
});
