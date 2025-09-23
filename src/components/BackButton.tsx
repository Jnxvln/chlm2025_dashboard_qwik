import { component$ } from '@builder.io/qwik';

export default component$(() => (
  <button
    onClick$={() => history.back()}
    class="btn btn-ghost btn-sm"
  >
    ← Back
  </button>
));
