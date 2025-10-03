import { component$ } from '@builder.io/qwik';
import PageTitle from '~/components/PageTitle';

interface Calculator {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export default component$(() => {
  const calculators: Calculator[] = [
    {
      title: 'Cost Calculator',
      description: 'Calculate material costs with freight, fuel surcharges, and yard delivery pricing',
      href: '/calculators/cost',
      icon: '💰',
    },
    {
      title: 'Project Calculator',
      description: 'Estimate cubic yards needed for your project based on dimensions',
      href: '/calculators/project',
      icon: '📐',
    },
  ];

  return (
    <section class="container mx-auto p-6">
      <PageTitle text="Calculators" />
      <p class="mb-6" style="color: rgb(var(--color-text-secondary))">
        Select a calculator to get started
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        {calculators.map((calc) => (
          <a
            key={calc.href}
            href={calc.href}
            class="group block p-6 rounded-lg border-2 transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'rgb(var(--color-bg-primary))',
              borderColor: 'rgb(var(--color-border))',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            }}
          >
            <div class="flex flex-col h-full">
              {/* Icon */}
              <div
                class="text-4xl mb-4 transition-transform duration-200 group-hover:scale-110"
                style="filter: grayscale(0.3);"
              >
                {calc.icon}
              </div>

              {/* Title */}
              <h3
                class="text-xl font-bold mb-2 group-hover:underline"
                style="color: rgb(var(--color-text-primary))"
              >
                {calc.title}
              </h3>

              {/* Description */}
              <p
                class="text-sm flex-grow"
                style="color: rgb(var(--color-text-secondary))"
              >
                {calc.description}
              </p>

              {/* Arrow indicator */}
              <div
                class="mt-4 flex items-center gap-2 text-sm font-medium transition-transform duration-200 group-hover:translate-x-2"
                style="color: rgb(var(--color-accent))"
              >
                Open Calculator
                <span>→</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
});
