import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { PrismaClient } from "@prisma/client";
import { NavLink } from "~/components/NavLink";
import PageTitle from "~/components/PageTitle";

export const useGetDrivers = routeLoader$(async () => {
	const prisma = new PrismaClient();
	const drivers = await prisma.driver.findMany();
	return drivers;
})

export default component$(() => {

	const drivers = useGetDrivers();

	return (
		<section>
			<PageTitle text="Drivers" />
			<p>This is the Drivers page</p>

			<div class="mt-2 mb-4">
				<NavLink href="/drivers/create" class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-2 py-1 pb-1.5 transition-colors duration-150 ease-in-out">New Driver</NavLink>
			</div>

			<div>
				{drivers.value.map((driver) => (
					<div key={driver.id}>
						<div>Name: {driver.firstName} {driver.lastName}</div>
						<div>Truck: {driver.defaultTruck}</div>
						<div>ED Pay Rate: ${driver.endDumpPayRate.toFixed(2)}</div>
						<div>FB Pay Rate: ${driver.flatBedPayRate.toFixed(2)}</div>
						<div>Non-Commission Rate: ${driver.nonCommissionRate.toFixed(2)}</div>
						<div>Date Hired: {driver.dateHired && new Date(driver.dateHired).toLocaleDateString()}</div>
						<div>Date Released: {driver.dateReleased && new Date(driver.dateReleased).toLocaleDateString()}</div>
					</div>
				))}
			</div>
		</section>
	)
})