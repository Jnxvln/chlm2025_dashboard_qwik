import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { PrismaClient } from "@prisma/client";
import { NavLink } from "~/components/NavLink";
import PageTitle from "~/components/PageTitle";
import { DriverTable } from "~/components/drivers/DriverTable";

export const useGetDrivers = routeLoader$(async (event) => {
	const prisma = new PrismaClient();
	const drivers = await prisma.driver.findMany();
	const highlightedId = event.url.searchParams.get('highlight');
	return { drivers, highlightedId };
})

export default component$(() => {

	const data = useGetDrivers();

	useVisibleTask$(() => {
		const url = new URL(window.location.href);
		if (url.searchParams.has('highlight')) {
			url.searchParams.delete('highlight');
			history.replaceState(null, '', url.toString());
		}
	});

	return (
		<section>
			<PageTitle text="Drivers" />
			<p class="mb-4">List of active and historical drivers.</p>

			<div class="mb-6">
				<NavLink
					href="/drivers/create"
					class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
				>
					+ New Driver
				</NavLink>
			</div>

			<DriverTable 
				drivers={data.value.drivers} 
				highlightId={data.value.highlightedId ?? undefined} 
			/>
		</section>
	)
})