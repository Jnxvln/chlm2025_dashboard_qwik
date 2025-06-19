import { component$ } from "@builder.io/qwik";
import { NavLink } from "~/components/NavLink";

export default component$(() => {
	return (
		<section>
			<h1>Cost Calculator</h1>
			<p>This is the Cost Calculator page</p>
			<NavLink href="/calculators">Back to Calculators</NavLink>
		</section>
	);
})