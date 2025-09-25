import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useEditHaulAction = routeAction$(
  async (data) => {
    try {
      const haul = await db.haul.update({
        where: { id: data.haulId },
        data: {
          dateHaul: new Date(data.dateHaul),
          truck: data.truck,
          customer: data.customer,
          chInvoice: data.chInvoice || null,
          loadType: data.loadType,
          loadRefNum: data.loadRefNum || null,
          rateMetric: data.rateMetric,
          rate: data.rate,
          quantity: data.quantity,
          vendorProduct: {
            connect: { id: data.vendorProductId }
          },
          freightRoute: {
            connect: { id: data.freightRouteId }
          },
          // Note: workdayId and createdById are not updated in edits
        },
      });

      return {
        success: true,
        haulId: haul.id,
        returnTo: data.returnTo || null,
      };
    } catch (error) {
      console.error('Haul update failed:', error);
      return { success: false, error: 'Failed to update haul' };
    }
  },
  zod$({
    haulId: z.coerce.number(),
    dateHaul: z.string().transform((s) => new Date(s)),
    truck: z.string(),
    customer: z.string(),
    chInvoice: z.string().optional(),
    loadType: z.enum(['enddump', 'flatbed']),
    loadRefNum: z.string().optional(),
    rateMetric: z.enum(['ton', 'mile', 'hour']),
    rate: z.coerce.number().gt(0),
    quantity: z.coerce.number().gt(0),
    vendorProductId: z.coerce.number(),
    freightRouteId: z.coerce.number(),
    returnTo: z.string().optional(),
  }),
);