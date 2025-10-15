import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useNewHaulAction = routeAction$(
  async (data) => {
    try {
      // Validate workdayId exists
      if (!data.workdayId) {
        return { success: false, error: 'Workday is required to create a haul' };
      }

      const haul = await db.haul.create({
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
          vendorProductId: data.vendorProductId || null,
          freightRouteId: data.freightRouteId || null,
          workdayId: data.workdayId,
          createdById: data.createdById,
        },
      });

      return {
        success: true,
        haulId: haul.id,
        returnTo: data.returnTo || null,
      };
    } catch (error) {
      console.error('Haul creation failed:', error);
      return { success: false, error: 'Failed to create haul' };
    }
  },
  zod$({
    dateHaul: z.string().transform((s) => new Date(s + 'T12:00:00Z')),
    truck: z.string(),
    customer: z.string(),
    chInvoice: z.string().optional(),
    loadType: z.enum(['enddump', 'flatbed']),
    loadRefNum: z.string().optional(),
    rateMetric: z.enum(['ton', 'mile', 'hour']),
    rate: z.coerce.number().gte(0),
    quantity: z.coerce.number().gte(0),
    vendorProductId: z.coerce.number().optional(),
    freightRouteId: z.coerce.number().optional(),
    workdayId: z.coerce.number(),
    createdById: z.coerce.number(),
    returnTo: z.string().optional(),
  }),
);
