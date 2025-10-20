import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';

export const useNewHaulAction = routeAction$(
  async (values) => {
    try {
      // Normalize capitalization before saving (flatbedFrom/To preserved for company initials, enum fields preserved)
      const normalized = normalizeFormData(values, {
        skipFields: ['flatbedFrom', 'flatbedTo', 'loadType', 'rateMetric'],
      });

      let workdayId = normalized.workdayId;

      // If workdayId is 0 or negative, we need to create a new workday
      if (!workdayId || workdayId <= 0) {
        if (!normalized.driverId) {
          return { success: false, error: 'Driver is required to create a workday' };
        }

        // Create new workday
        const workday = await db.workday.create({
          data: {
            driverId: normalized.driverId,
            date: new Date(normalized.dateHaul),
            chHours: 0,
            ncHours: 0,
            offDuty: false,
            createdById: normalized.createdById,
          },
        });

        workdayId = workday.id;
      }

      const haul = await db.haul.create({
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
          workdayId: workdayId,
          createdById: normalized.createdById,
        },
      });

      return {
        success: true,
        haulId: haul.id,
        workdayId: workdayId,
        returnTo: normalized.returnTo || null,
      };
    } catch (error) {
      console.error('Haul creation failed:', error);
      return { success: false, error: 'Failed to create haul' };
    }
  },
  zod$({
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
    workdayId: z.coerce.number(),
    driverId: z.coerce.number(),
    createdById: z.coerce.number(),
    returnTo: z.string().optional(),
  }),
);
