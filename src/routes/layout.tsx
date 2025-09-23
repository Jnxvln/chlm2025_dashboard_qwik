import { component$, Slot } from '@builder.io/qwik';
import { Nav } from '~/components/Nav';

export default component$(() => {
  return (
    <>
      <Nav />
      <main class="max-w-6xl mx-auto p-6">
        <Slot />
      </main>
    </>
  );
});
