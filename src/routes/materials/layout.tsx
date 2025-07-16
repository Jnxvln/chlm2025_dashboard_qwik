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
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          Materials
        </NavLink>

        <NavLink
          href="/materials/categories"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
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
