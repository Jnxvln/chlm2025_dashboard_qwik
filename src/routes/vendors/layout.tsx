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
          class="btn btn-accent btn-sm"
          activeStyle="background-color: rgb(var(--color-warning)); color: rgb(var(--color-text-inverse)); border-color: rgb(var(--color-warning));"
          exact
        >
          Vendors
        </NavLink>

        <NavLink
          href="/vendors/locations"
          class="btn btn-accent btn-sm"
          activeStyle="background-color: rgb(var(--color-warning)); color: rgb(var(--color-text-inverse)); border-color: rgb(var(--color-warning));"
          exact
        >
          Locations
        </NavLink>

        <NavLink
          href="/vendors/routes"
          class="btn btn-accent btn-sm"
          activeStyle="background-color: rgb(var(--color-warning)); color: rgb(var(--color-text-inverse)); border-color: rgb(var(--color-warning));"
          exact
        >
          Freight Routes
        </NavLink>

        <NavLink
          href="/vendors/products"
          class="btn btn-accent btn-sm"
          activeStyle="background-color: rgb(var(--color-warning)); color: rgb(var(--color-text-inverse)); border-color: rgb(var(--color-warning));"
          exact
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
