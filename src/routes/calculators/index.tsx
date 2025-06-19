import { component$ } from "@builder.io/qwik";
import { NavLink } from "~/components/NavLink";

export default component$(() => {
	return (
		<section>
		    <h1>Calculators</h1>
            <p>This is the Calculators page</p>
			<nav class="flex flex-col gap-3">
				<NavLink href="/calculators/cost">Cost Calculator (Cubic Yards)</NavLink>
				<NavLink href="/calculators/project">Project Calculator (Cubic Yards)</NavLink>
			</nav>
        </section>
	);
})