import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import PageSubtitle from "~/components/PageSubtitle";
import PageTitle from "~/components/PageTitle";

export default component$(() => {
  return (
    <>
      <PageTitle text="Dashboard" />

      {/* Notices Section */}
      <section class="mt-4 p-4 bg-gray-100 rounded-lg">
        <PageSubtitle text="Notices" />
        <div class="mt-2">
          <p>This is where the most important notices will be displayed.</p>
        </div>
      </section>

      {/* Waitlist Section (Oldest?) */}
      <section class="mt-4 p-4 bg-gray-100 rounded-lg">
        <PageSubtitle text="Waitlist" />
        <div class="mt-2">
          <p>The oldest </p>
        </div>
      </section>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
