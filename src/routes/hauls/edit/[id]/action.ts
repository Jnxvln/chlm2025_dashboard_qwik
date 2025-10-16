import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useEditHaulAction = routeAction$(
  async (data) => {
    try {
      const haul = await db.haul.update({
        where: { id: data.haulId },
        data: {
          dateHaul: new Date(data.dateHaul),
          loadTime: data.loadTime,
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
          flatbedFrom: data.flatbedFrom || null,
          flatbedTo: data.flatbedTo || null,
          flatbedMaterial: data.flatbedMaterial || null,
          // Note: workdayId and createdById are not updated in edits
        },
        select: {
          id: true,
          workdayId: true,
        },
      });

      return {
        success: true,
        haulId: haul.id,
        workdayId: haul.workdayId,
        returnTo: data.returnTo || null,
      };
    } catch (error) {
      console.error('Haul update failed:', error);
      return { success: false, error: 'Failed to update haul' };
    }
  },
  zod$({
    haulId: z.coerce.number(),
    dateHaul: z.string().transform((s) => new Date(s + 'T12:00:00Z')),
    loadTime: z.string(),
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
    flatbedFrom: z.string().optional(),
    flatbedTo: z.string().optional(),
    flatbedMaterial: z.string().optional(),
    returnTo: z.string().optional(),
  }),
);