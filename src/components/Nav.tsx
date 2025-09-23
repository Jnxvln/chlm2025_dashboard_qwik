import { $, component$, useSignal } from '@builder.io/qwik';
import { NavLink } from './NavLink';
import { ThemeToggle } from './ThemeToggle';

export const Nav = component$(() => {
  const isOpen = useSignal(false);

  const closeMenu = $(() => {
    isOpen.value = false;
  });

  const links = [
    { href: '/', label: 'Home' },
    { href: '/drivers', label: 'Drivers' },
    { href: '/hauls', label: 'Hauls' },
    { href: '/vendors', label: 'Vendors' },
    { href: '/materials', label: 'Materials' },
    { href: '/waitlist', label: 'Wait List' },
    { href: '/calculators', label: 'Calculators' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav style="background-color: rgb(var(--color-bg-tertiary)); color: rgb(var(--color-text-primary)); border-bottom: 1px solid rgb(var(--color-border))" class="px-4 py-3 shadow-sm">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <NavLink href="/" class="text-xl font-bold" style="color: rgb(var(--color-accent))">
          CHLM
        </NavLink>

        {/* Desktop Links */}
        <div class="hidden md:flex items-center space-x-6">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              class="transition-colors duration-200"
              style="color: rgb(var(--color-text-secondary))"
              activeClass="font-semibold"
              activeStyle="color: rgb(var(--color-accent))"
            >
              {link.label}
            </NavLink>
          ))}
          <div class="ml-4 pl-4 border-l" style="border-color: rgb(var(--color-border))">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div class="md:hidden flex items-center space-x-3">
          <ThemeToggle />
          <button
            class="focus:outline-none transition-colors"
            style="color: rgb(var(--color-text-primary))"
            onClick$={() => (isOpen.value = !isOpen.value)}
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d={
                  isOpen.value
                    ? 'M6 18L18 6M6 6l12 12' // X icon
                    : 'M4 6h16M4 12h16M4 18h16'
                } // Hamburger
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Links */}
      <div
        class={`flex flex-col space-y-2 mt-3 px-4 ${isOpen.value ? 'block' : 'hidden'} md:hidden`}
      >
        {links.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            class="transition-colors duration-200 py-2"
            style="color: rgb(var(--color-text-secondary))"
            activeClass="font-semibold"
            activeStyle="color: rgb(var(--color-accent))"
            onClick$={closeMenu}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
});
