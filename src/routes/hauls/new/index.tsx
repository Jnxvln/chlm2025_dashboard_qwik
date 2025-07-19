import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import {
  Form,
  routeAction$,
  z,
  zod$,
  useLocation,
  useNavigate,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
export { useNewHaulLoader } from './loader';
import { useNewHaulLoader } from './loader';
import PageTitle from '~/components/PageTitle';

export const useNewHaulAction = routeAction$(
  async (data, event) => {
    try {
      const haul = await db.haul.create({
        data: {
          dateHaul: new Date(data.dateHaul),
          truck: data.truck,
          customer: data.customer,
          chInvoice: data.chInvoice || null,
          invoice: data.invoice || null,
          loadType: data.loadType,
          vendorProductId: data.vendorProductId,
          freightRouteId: data.freightRouteId,
          tons: data.tons,
          rate: data.rate,
          miles: data.miles,
          payRate: data.payRate,
          workdayId: data.workdayId,
          createdById: data.createdById,
        },
      });

      if (data.returnTo && typeof data.returnTo === 'string') {
        throw event.redirect(302, data.returnTo);
      }

      return { success: true, haulId: haul.id };
    } catch (error) {
      console.error('Haul creation failed:', error);
      return { success: false, error: 'Failed to create haul' };
    }
  },
  zod$({
    dateHaul: z.string().transform((s) => new Date(s)),
    truck: z.string(),
    customer: z.string(),
    chInvoice: z.string().optional(),
    invoice: z.string().optional(),
    loadType: z.enum(['enddump', 'flatbed']),
    vendorProductId: z.coerce.number(),
    freightRouteId: z.coerce.number(),
    tons: z.coerce.number(),
    rate: z.coerce.number(),
    miles: z.coerce.number(),
    payRate: z.coerce.number(),
    workdayId: z.coerce.number(),
    createdById: z.coerce.number(),
    returnTo: z.string().optional(),
  }),
);

export default component$(() => {
  const createAction = useNewHaulAction();
  const data = useNewHaulLoader();
  const driver = data.value.driver;
  const nav = useNavigate();
  const loc = useLocation();

  const driverId = loc.url.searchParams.get('driver');
  const startDate = loc.url.searchParams.get('startDate');
  const endDate = loc.url.searchParams.get('endDate');
  const returnTo = loc.url.searchParams.get('returnTo');

  const today = new Date().toISOString().split('T')[0];

  useVisibleTask$(({ track }) => {
    const result = track(() => createAction.value);
    if (createAction.value?.success && result?.haulId) {
      setTimeout(() => {
        nav(returnTo || '/hauls');
      }, 1000);
    }
  });

  return (
    <div class="p-6 max-w-2xl mx-auto">
      {returnTo && (
        <div class="mb-4">
          <a
            href={returnTo}
            class="inline-block text-sm text-blue-600 hover:underline"
          >
            ← Back to Hauls
          </a>
        </div>
      )}

      <header class="mb-6">
        <PageTitle text="New Haul" />
        <p class="text-lg text-gray-600 dark:text-gray-500">
          for{' '}
          <span class="font-medium text-gray-800 dark:text-gray-600">
            {driver.firstName} {driver.lastName}
          </span>
        </p>
      </header>

      <Form action={createAction} class="space-y-4">
        <input type="hidden" name="returnTo" value={returnTo || ''} />
        <input type="hidden" name="workdayId" value={data.value.workdayId} />
        <input
          type="hidden"
          name="createdById"
          value={data.value.createdById}
        />

        <div>
          <label class="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            name="dateHaul"
            required
            defaultValue={today}
            class="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Truck</label>
          <input
            type="text"
            name="truck"
            required
            placeholder=""
            class="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Customer</label>
          <input
            type="text"
            name="customer"
            required
            placeholder=""
            class="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* =================================================================================== */}
        <div>
          <label class="block text-sm font-medium mb-1">Material</label>
          <select
            name="vendorProductId"
            required
            class="w-full border px-3 py-2 rounded"
          >
            {data.value.vendorProducts.map((vp) => (
              <option key={vp.id} value={vp.id}>
                {vp.vendor.shortName} – {vp.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Freight Route</label>
          <select
            name="freightRouteId"
            required
            class="w-full border px-3 py-2 rounded"
          >
            {data.value.freightRoutes.map((fr) => (
              <option key={fr.id} value={fr.id}>
                {fr.vendorLocation.name} → {fr.destination}
              </option>
            ))}
          </select>
        </div>

        {/* Add more fields later — this is just to test routing + flow */}
        {/* =================================================================================== */}

        <div class="flex gap-4 justify-end">
          <a
            href={returnTo || '/hauls'}
            class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </a>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>

        {createAction.value?.error && (
          <div class="p-3 text-red-600 bg-red-100 border border-red-300 rounded">
            {createAction.value.error}
          </div>
        )}

        {createAction.value?.success && (
          <div class="p-3 text-green-600 bg-green-100 border border-green-300 rounded">
            Haul created successfully! Redirecting...
          </div>
        )}
      </Form>
    </div>
  );
});
