import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import PageSubtitle from '~/components/PageSubtitle';
import PageTitle from '~/components/PageTitle';

export default component$(() => {
  return (
    <div class="container mx-auto p-6">
      <PageTitle text="Dashboard" />

      {/* Notices Section */}
      <section class="mb-8">
        <div class="card">
          <div class="card-header" style="background: linear-gradient(135deg, rgb(var(--color-primary) / 0.1), rgb(var(--color-secondary) / 0.1))">
            <PageSubtitle text="Notices" />
          </div>

          {/* Notices placeholder listing */}
          <div class="space-y-4">
            <div class="flex items-start space-x-3 p-4 rounded-lg border-l-4" style="background-color: rgb(var(--color-warning) / 0.1); border-color: rgb(var(--color-warning))">
              <div class="flex-shrink-0 w-2 h-2 rounded-full mt-2" style="background-color: rgb(var(--color-warning))"></div>
              <div>
                <p class="text-sm" style="color: rgb(var(--color-text-primary))">
                  <span class="font-medium" style="color: rgb(var(--color-warning))">6/23/2025:</span> Waiting on Cherry Blend to come in for Larry Williams (see waitlist)
                </p>
              </div>
            </div>
            <div class="flex items-start space-x-3 p-4 rounded-lg border-l-4" style="background-color: rgb(var(--color-success) / 0.1); border-color: rgb(var(--color-success))">
              <div class="flex-shrink-0 w-2 h-2 rounded-full mt-2" style="background-color: rgb(var(--color-success))"></div>
              <div>
                <p class="text-sm" style="color: rgb(var(--color-text-primary))">
                  <span class="font-medium" style="color: rgb(var(--color-success))">6/21/2025:</span> John Doe did pay his outstanding balance (okay to sign again.)
                </p>
              </div>
            </div>
            <div class="flex items-start space-x-3 p-4 rounded-lg border-l-4" style="background-color: rgb(var(--color-danger) / 0.1); border-color: rgb(var(--color-danger))">
              <div class="flex-shrink-0 w-2 h-2 rounded-full mt-2" style="background-color: rgb(var(--color-danger))"></div>
              <div>
                <p class="text-sm" style="color: rgb(var(--color-text-primary))">
                  <span class="font-medium" style="color: rgb(var(--color-danger))">6/20/2025:</span> NO deliveries for Kelly this Friday the 25th.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section (Oldest?) */}
      <section class="mb-8">
        <div class="card">
          <div class="card-header" style="background: linear-gradient(135deg, rgb(var(--color-accent) / 0.1), rgb(var(--color-primary) / 0.1))">
            <PageSubtitle text="Waitlist" />
            <p class="card-subtitle">The oldest top 10 entries listed here</p>
          </div>

          {/* Waitlist placeholder listing */}
          <div class="space-y-3">
            <div class="flex items-center justify-between p-4 rounded-lg transition-colors" style="background-color: rgb(var(--color-surface-hover))">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background-color: rgb(var(--color-accent) / 0.2)">
                  <span class="text-xs font-medium" style="color: rgb(var(--color-accent))">LW</span>
                </div>
                <div>
                  <p class="font-medium" style="color: rgb(var(--color-text-primary))">Larry Williams</p>
                  <p class="text-sm" style="color: rgb(var(--color-text-secondary))">2PL 4x4 Cherry Blend</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">555-627-1255</p>
                <p class="text-xs" style="color: rgb(var(--color-text-tertiary))">5/22/2025</p>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg transition-colors" style="background-color: rgb(var(--color-surface-hover))">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background-color: rgb(var(--color-primary) / 0.2)">
                  <span class="text-xs font-medium" style="color: rgb(var(--color-primary))">TL</span>
                </div>
                <div>
                  <p class="font-medium" style="color: rgb(var(--color-text-primary))">Tina Lybeck</p>
                  <p class="text-sm" style="color: rgb(var(--color-text-secondary))">1PL Med Mossy Boulders</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">555-631-2479</p>
                <p class="text-xs" style="color: rgb(var(--color-text-tertiary))">5/30/2025</p>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg transition-colors" style="background-color: rgb(var(--color-surface-hover))">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background-color: rgb(var(--color-success) / 0.2)">
                  <span class="text-xs font-medium" style="color: rgb(var(--color-success))">CL</span>
                </div>
                <div>
                  <p class="font-medium" style="color: rgb(var(--color-text-primary))">Connor Lebobby</p>
                  <p class="text-sm" style="color: rgb(var(--color-text-secondary))">4yds Red Mulch</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">555-473-6448</p>
                <p class="text-xs" style="color: rgb(var(--color-text-tertiary))">6/16/2025</p>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg transition-colors" style="background-color: rgb(var(--color-surface-hover))">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background-color: rgb(var(--color-warning) / 0.2)">
                  <span class="text-xs font-medium" style="color: rgb(var(--color-warning))">MO</span>
                </div>
                <div>
                  <p class="font-medium" style="color: rgb(var(--color-text-primary))">Mila O'Reilly</p>
                  <p class="text-sm" style="color: rgb(var(--color-text-secondary))">?yds Oversize Blue/White</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">555-497-1489</p>
                <p class="text-xs" style="color: rgb(var(--color-text-tertiary))">6/20/2025</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'CHLM Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Qwik site description',
    },
  ],
};
