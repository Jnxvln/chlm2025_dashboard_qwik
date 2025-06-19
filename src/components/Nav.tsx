import { $, component$, useSignal } from "@builder.io/qwik";
import { NavLink } from "./NavLink";

export const Nav = component$(() => {
	const isOpen = useSignal(false);

	const closeMenu = $(() => { isOpen.value = false; })

	const links = [
		{ href: '/drivers', label: 'Drivers' },
		{ href: '/hauls', label: 'Hauls' },
		{ href: '/materials', label: 'Materials' },
		{ href: '/vendors', label: 'Vendors' },
		{ href: '/waitlist', label: 'WaitList' },
		{ href: '/calculators', label: 'Calculators' },
		{ href: '/settings', label: 'Settings' },
	];

	return (
		<nav class="bg-neutral-900 text-white px-4 py-3 shadow">
			<div class="max-w-6xl mx-auto flex justify-between items-center">
				{/* Logo */}
				<NavLink href="/" class="text-xl font-bold">CHLM</NavLink>

				{/* Desktop Links */}
				<div class="hidden md:flex space-x-6">
					{links.map(link => (
						<NavLink
							key={link.href}
							href={link.href}
							class="hover:text-teal-400"
							activeClass="text-teal-400 font-semibold"
							>
							{link.label}
						</NavLink>
					))}
				</div>

				{/* Hamburger Icon (only on mobile) */}
				<button
					class="md:hidden text-white focus:outline-none"
					onClick$={() => (isOpen.value = !isOpen.value)}
					>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2"
						viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round"
						d={isOpen.value
							? "M6 18L18 6M6 6l12 12" // X icon
							: "M4 6h16M4 12h16M4 18h16"} // Hamburger
						/>
					</svg>
				</button>
			</div>

			{/* Mobile Links */}
			<div class={`flex flex-col space-y-2 mt-3 px-4 ${isOpen.value ? 'block' : 'hidden'} md:hidden`}>
				{links.map(link => (
					<NavLink
						key={link.href}
						href={link.href}
						class="hover:text-teal-400 transition-colors duration-150"
						activeClass="text-teal-400 font-semibold"
						onClick$={closeMenu}
					>
						{link.label}
					</NavLink>
				))}
			</div>
		</nav>
	)
})