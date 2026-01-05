// src/routes/workdays/layout.tsx
import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useDriversLoader = routeLoader$(async () => {
  const drivers = await db.driver.findMany({
    where: { isActive: true },
    orderBy: { firstName: 'asc' },
  });
  return drivers;
});

export const useDriverParam = routeLoader$(({ query }) => {
  return query.get('driver') ?? '';
});

export const useCurrentUserLoader = routeLoader$(async () => {
  const user = await db.user.findFirst();
  return user;
});

export const useSettingsLoader = routeLoader$(async() => {
  const settings = await db.settings.findFirst();
  if (!settings) return null;
  return {
    ...settings,
    driverDefaultNCPayRate: Number(settings.driverDefaultNCPayRate?.toString() ?? 0),
    driverDefaultHolidayPayRate: Number(settings.driverDefaultHolidayPayRate?.toString() ?? 0),
  }
})