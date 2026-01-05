import { $ } from '@builder.io/qwik';

export type NcItemDraft = {
  id?: number;
  description: string;
  hours: number;
  rate: number | null;
};

export function parseNcItemsJson(input: unknown): NcItemDraft[] {
  if (!input || typeof input !== 'string') return [];

  try {
    const raw = JSON.parse(input);
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x) => ({
        description: String(x?.description ?? '').trim(),
        hours: Number(x?.hours ?? 0),
        rate:
          x?.rate === '' || x?.rate === null || typeof x?.rate === 'undefined'
            ? null
            : Number(x?.rate),
      }))
      .filter(
        (x) =>
          x.description.length > 0 && Number.isFinite(x.hours) && x.hours >= 0,
      );
  } catch {
    return [];
  }
}

export const getDefaultRate = $(
  (drivers: any[], driverIdStr: string, precomputedSettingsRate: any) => {
    const driverId = Number(driverIdStr);
    const drv = drivers.find((d) => d.id === driverId);
    const driverRate = drv?.nonCommissionRate ?? null;

    return Number.isFinite(driverRate as any)
      ? Number(driverRate)
      : Number.isFinite(precomputedSettingsRate)
        ? Number(precomputedSettingsRate)
        : 0;
  },
);
