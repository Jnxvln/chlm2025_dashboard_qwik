import { component$ } from "@builder.io/qwik";
import PageTitle from "~/components/PageTitle";

export default component$(() => {
	return (
		<section>
			<PageTitle text="Waiting List" />
			<p>This is the Waiting List page</p>
		</section>
	)
})