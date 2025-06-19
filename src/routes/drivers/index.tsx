import { component$ } from "@builder.io/qwik";
import PageTitle from "~/components/PageTitle";

export default component$(() => {
	return (
		<section>
			<PageTitle text="Drivers" />
			<p>This is the Drivers page</p>
		</section>
	)
})