import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useHaulsSummaryLoader = routeLoader$(async (event) => {
  const { url } = event;

  // Parse query params
  const driverId = parseInt(url.searchParams.get('driverId') || '', 10);
  const startDateStr = url.searchParams.get('startDate');
  const endDateStr = url.searchParams.get('endDate');

  const isValidDate = (d?: string | null) => !!d && !isNaN(Date.parse(d));

  // Validate required parameters
  if (isNaN(driverId) || !isValidDate(startDateStr) || !isValidDate(endDateStr)) {
    return {
      error: {
        type: 'missing_parameters',
        message: 'Missing required parameters: driver, start date, and end date are required.',
        redirectTo: '/hauls'
      }
    };
  }

  const startDate = new Date(startDateStr!);
  const endDate = new Date(endDateStr!);

  // Validate date range (max 7 days)
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 7) {
    return {
      error: {
        type: 'date_range_exceeded',
        message: `Date range is ${daysDiff} days, but reports are limited to 7 days maximum. Please select a shorter date range.`,
        redirectTo: `/hauls?driver=${driverId}&startDate=${startDateStr}&endDate=${endDateStr}`
      }
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
        redirectTo: '/hauls'
      }
    };
  }

  // Load all workdays in the date range for this driver
  const workdays = await db.workday.findMany({
    where: {
      driverId: driverId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      driver: true,
      hauls: {
        include: {
          vendorProduct: {
            include: {
              vendor: true,
              vendorLocation: true,
            },
          },
          freightRoute: true,
        },
        orderBy: { dateHaul: 'asc' },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Flatten all hauls from all workdays and sort by dateHaul
  const allHauls = workdays
    .flatMap(workday =>
      workday.hauls.map(haul => ({
        ...haul,
        workday: {
          id: workday.id,
          date: workday.date,
          chHours: workday.chHours,
          ncHours: workday.ncHours,
          ncReasons: workday.ncReasons,
        }
      }))
    )
    .sort((a, b) => new Date(a.dateHaul).getTime() - new Date(b.dateHaul).getTime());

  // Calculate totals
  const totalChHours = workdays.reduce((sum, wd) => sum + wd.chHours, 0);
  const totalNcHours = workdays.reduce((sum, wd) => sum + wd.ncHours, 0);

  // Build detailed NC reasons with dates and hours
  const ncReasonDetails = workdays
    .filter(wd => wd.ncHours > 0 && wd.ncReasons)
    .map(wd => {
      const dateStr = new Date(wd.date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
      });
      return `${dateStr}: ${wd.ncReasons} (${wd.ncHours}hr)`;
    });

  return {
    success: true,
    driver,
    workdays,
    allHauls,
    startDate: startDateStr!,
    endDate: endDateStr!,
    totals: {
      chHours: totalChHours,
      ncHours: totalNcHours,
      ncReasonDetails,
    },
  };
});