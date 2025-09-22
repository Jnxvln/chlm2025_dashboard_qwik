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
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <header class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <PageSubtitle text="Notices" />
          </header>

          {/* Notices placeholder listing */}
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-start space-x-3 p-3 rounded-lg bg-amber-50 border-l-4 border-amber-400">
                <div class="flex-shrink-0 w-2 h-2 bg-amber-400 rounded-full mt-2"></div>
                <div>
                  <p class="text-sm text-gray-700">
                    <span class="font-medium text-amber-700">6/23/2025:</span> Waiting on Cherry Blend to come in for Larry Williams (see waitlist)
                  </p>
                </div>
              </div>
              <div class="flex items-start space-x-3 p-3 rounded-lg bg-green-50 border-l-4 border-green-400">
                <div class="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p class="text-sm text-gray-700">
                    <span class="font-medium text-green-700">6/21/2025:</span> John Doe did pay his outstanding balance (okay to sign again.)
                  </p>
                </div>
              </div>
              <div class="flex items-start space-x-3 p-3 rounded-lg bg-red-50 border-l-4 border-red-400">
                <div class="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                <div>
                  <p class="text-sm text-gray-700">
                    <span class="font-medium text-red-700">6/20/2025:</span> NO deliveries for Kelly this Friday the 25th.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section (Oldest?) */}
      <section class="mb-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <header class="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
            <PageSubtitle text="Waitlist" />
            <p class="text-sm text-gray-600 mt-1">The oldest top 10 entries listed here</p>
          </header>

          {/* Waitlist placeholder listing */}
          <div class="p-6">
            <div class="space-y-3">
              <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span class="text-xs font-medium text-purple-600">LW</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">Larry Williams</p>
                    <p class="text-sm text-gray-600">2PL 4x4 Cherry Blend</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">555-627-1255</p>
                  <p class="text-xs text-gray-500">5/22/2025</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="text-xs font-medium text-blue-600">TL</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">Tina Lybeck</p>
                    <p class="text-sm text-gray-600">1PL Med Mossy Boulders</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">555-631-2479</p>
                  <p class="text-xs text-gray-500">5/30/2025</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span class="text-xs font-medium text-green-600">CL</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">Connor Lebobby</p>
                    <p class="text-sm text-gray-600">4yds Red Mulch</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">555-473-6448</p>
                  <p class="text-xs text-gray-500">6/16/2025</p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span class="text-xs font-medium text-orange-600">MO</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">Mila O'Reilly</p>
                    <p class="text-sm text-gray-600">?yds Oversize Blue/White</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">555-497-1489</p>
                  <p class="text-xs text-gray-500">6/20/2025</p>
                </div>
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
