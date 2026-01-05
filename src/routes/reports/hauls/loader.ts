import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

function toNum(v: any): number {
  // handles Prisma Decimal, number, string
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  // Prisma Decimal has toNumber()
  if (typeof v?.toNumber === 'function') return v.toNumber();
  // fallback
  return Number(v);
}

function toNumOrNull(v: any): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v === '' ? null : Number(v);
  if (typeof v?.toNumber === 'function') return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const useHaulsSummaryLoader = routeLoader$(async (event) => {
  const { url } = event;

  // Parse query params
  const driverId = parseInt(url.searchParams.get('driverId') || '', 10);
  const startDateStr = url.searchParams.get('startDate');
  const endDateStr = url.searchParams.get('endDate');

  const isValidDate = (d?: string | null) => !!d && !isNaN(Date.parse(d));

  // Validate required parameters
  if (
    isNaN(driverId) ||
    !isValidDate(startDateStr) ||
    !isValidDate(endDateStr)
  ) {
    return {
      error: {
        type: 'missing_parameters',
        message:
          'Missing required parameters: driver, start date, and end date are required.',
        redirectTo: '/hauls',
      },
    };
  }

  const startDate = new Date(startDateStr!);
  const endDate = new Date(endDateStr!);

  // Validate date range (max 7 days)
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysDiff > 7) {
    return {
      error: {
        type: 'date_range_exceeded',
        message: `Date range is ${daysDiff} days, but reports are limited to 7 days maximum. Please select a shorter date range.`,
        redirectTo: `/hauls?driver=${driverId}&startDate=${startDateStr}&endDate=${endDateStr}`,
      },
    };
  }

  // Load driver info
  const driver = await db.driver.findUnique({
    where: { id: driverId },
  });

  if (!driver) {
    return {
      error: {
        type: 'driver_not_found',
        message: 'Driver not found. Please select a valid driver.',
        redirectTo: '/hauls',
      },
    };
  }

  const sanitizedDriver = {
    ...driver,
    nonCommissionRate: toNumOrNull((driver as any).nonCommissionRate),
    endDumpPayRate: toNumOrNull((driver as any).endDumpPayRate),
    flatBedPayRate: toNumOrNull((driver as any).flatBedPayRate),
  };

  // Load settings for off-duty reason display
  const settings = await db.settings.findFirst();

  // Load all workdays in the date range for this driver
  const workdaysRaw = await db.workday.findMany({
    where: {
      driverId: driverId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      driver: true,
      ncItems: true,
      hauls: {
        include: {
          vendorProduct: {
            include: { vendor: true, vendorLocation: true },
          },
          freightRoute: true,
        },
        orderBy: { dateHaul: 'asc' },
      },
    },
    orderBy: { date: 'asc' },
  });

  // const workdays = await db.workday.findMany({
  //   where: {
  //     driverId: driverId,
  //     date: {
  //       gte: startDate,
  //       lte: endDate,
  //     },
  //   },
  //   include: {
  //     driver: true,
  //     ncItems: true,
  //     hauls: {
  //       include: {
  //         vendorProduct: {
  //           include: {
  //             vendor: true,
  //             vendorLocation: true,
  //           },
  //         },
  //         freightRoute: true,
  //       },
  //       orderBy: { dateHaul: 'asc' },
  //     },
  //   },
  //   orderBy: { date: 'asc' },
  // });

  const workdays = workdaysRaw.map((wd) => ({
    ...wd,
    chHours: toNum(wd.chHours),
    ncHours: toNum(wd.ncHours), // legacy cache
    driver: wd.driver
      ? {
          ...wd.driver,
          nonCommissionRate: toNumOrNull((wd.driver as any).nonCommissionRate),
          endDumpPayRate: toNumOrNull((wd.driver as any).endDumpPayRate),
          flatBedPayRate: toNumOrNull((wd.driver as any).flatBedPayRate),
        }
      : wd.driver,
    ncItems: (wd.ncItems || []).map((i) => ({
      ...i,
      hours: toNum(i.hours),
      rate: toNumOrNull(i.rate),
    })),
    hauls: (wd.hauls || []).map((h) => ({
      ...h,
      rate: toNum(h.rate),
      quantity: toNum(h.quantity),
    })),
  }));

  // Flatten all hauls from all workdays, PLUS add placeholder entries for off-duty days with no hauls
  const allHauls = workdays
    .flatMap((workday) => {
      // If workday is off-duty and has no hauls, create a placeholder entry
      if (workday.offDuty && workday.hauls.length === 0) {
        return [
          {
            id: -workday.id, // Negative ID to distinguish from real hauls
            dateHaul: workday.date,
            loadTime: '00:00',
            truck: '',
            customer: '',
            chInvoice: null,
            loadType: '',
            loadRefNum: null,
            vendorProductId: null,
            freightRouteId: null,
            flatbedFrom: null,
            flatbedTo: null,
            flatbedMaterial: null,
            rateMetric: '',
            rate: 0,
            quantity: 0,
            createdAt: workday.createdAt,
            updatedAt: workday.updatedAt,
            workdayId: workday.id,
            createdById: workday.createdById,
            vendorProduct: null,
            freightRoute: null,
            workday: {
              id: workday.id,
              date: workday.date,
              chHours: workday.chHours,
              // Keep legacy `ncHours` and `ncReasons` in case older records exist, but UI will use ncItems
              ncHours: workday.ncHours,
              ncReasons: workday.ncReasons,
              offDuty: workday.offDuty,
              offDutyReason: workday.offDutyReason,
            },
          },
        ];
      }

      // Otherwise, map the actual hauls
      return workday.hauls.map((haul) => ({
        ...haul,
        workday: {
          id: workday.id,
          date: workday.date,
          chHours: workday.chHours,
          ncHours: workday.ncHours,
          ncReasons: workday.ncReasons,
          offDuty: workday.offDuty,
          offDutyReason: workday.offDutyReason,
        },
      }));
    })
    .sort(
      (a, b) => new Date(a.dateHaul).getTime() - new Date(b.dateHaul).getTime(),
    );

  // Calculate totals (NOTE: Totals are now computed in the UI using ncItems)
  // But we still return settings + workdays + hauls
  // const totalChHours = workdays.reduce((sum, wd) => sum + wd.chHours, 0);
  // const totalNcHours = workdays.reduce((sum, wd) => sum + wd.ncHours, 0);

  // OBSOLETE (Delete?) - Build detailed NC reasons with dates and hours
  // const ncReasonDetails = workdays
  //   .filter((wd) => wd.ncHours > 0 && wd.ncReasons)
  //   .map((wd) => {
  //     const dateStr = new Date(wd.date).toLocaleDateString('en-US', {
  //       month: '2-digit',
  //       day: '2-digit',
  //     });
  //     return `${dateStr}: ${wd.ncReasons} (${wd.ncHours}hr)`;
  //   });

  return {
    success: true,
    driver: sanitizedDriver,
    workdays,
    allHauls,
    settings: settings
      ? {
          ...settings,
          driverDefaultNCPayRate: Number(settings.driverDefaultNCPayRate),
          driverDefaultHolidayPayRate: Number(
            settings.driverDefaultHolidayPayRate,
          ),
        }
      : null,
    startDate: startDateStr!,
    endDate: endDateStr!,
    // totals: {
    //   chHours: totalChHours,
    //   ncHours: totalNcHours,
    //   ncReasonDetails,
    // },
  };
});
