import { component$, Slot } from '@builder.io/qwik';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <div class="container mx-auto p-6">
      <PageTitle text="Vendors" />
      <p class="mb-4">List of active and historical vendors.</p>

      <div class="mb-6 gap-2 flex flex-row flex-wrap">
        <NavLink
          href="/vendors"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          Vendors
        </NavLink>

        <NavLink
          href="/vendors/locations"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          Locations
        </NavLink>

        <NavLink
          href="/vendors/products"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          Products
        </NavLink>
      </div>
      <main>
        <Slot />
      </main>
    </div>
  );
});
