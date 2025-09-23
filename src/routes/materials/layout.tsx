import { component$, Slot } from '@builder.io/qwik';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <div class="container mx-auto p-6">
      <PageTitle text="Materials" />
      <p class="mb-4">List of active and historical materials.</p>

      <div class="mb-6 gap-2 flex flex-row flex-wrap">
        <NavLink
          href="/materials"
          class="btn btn-accent btn-sm"
        >
          Materials
        </NavLink>

        <NavLink
          href="/materials/categories"
          class="btn btn-accent btn-sm"
        >
          Categories
        </NavLink>
      </div>
      <main>
        <Slot />
      </main>
    </div>
  );
});
