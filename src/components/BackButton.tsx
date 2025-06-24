import { component$ } from "@builder.io/qwik";

export default component$(() => (
	<button
		onClick$={() => history.back()}
		class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
	>
		← Back
	</button>
))