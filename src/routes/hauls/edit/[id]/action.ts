import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';

export const useEditHaulAction = routeAction$(
  async (values) => {
    try {
      // Normalize capitalization before saving (flatbedFrom/To preserved for company initials, enum fields preserved)
      const normalized = normalizeFormData(values, {
        skipFields: ['flatbedFrom', 'flatbedTo', 'loadType', 'rateMetric'],
      });

      const haul = await db.haul.update({
        where: { id: normalized.haulId },
        data: {
          dateHaul: new Date(normalized.dateHaul),
          loadTime: normalized.loadTime,
          truck: normalized.truck,
          customer: normalized.customer,
          chInvoice: normalized.chInvoice || null,
          loadType: normalized.loadType,
          loadRefNum: normalized.loadRefNum || null,
          rateMetric: normalized.rateMetric,
          rate: normalized.rate,
          quantity: normalized.quantity,
          vendorProductId: normalized.vendorProductId || null,
          freightRouteId: normalized.freightRouteId || null,
          flatbedFrom: normalized.flatbedFrom || null,
          flatbedTo: normalized.flatbedTo || null,
          flatbedMaterial: normalized.flatbedMaterial || null,
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
        returnTo: normalized.returnTo || null,
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