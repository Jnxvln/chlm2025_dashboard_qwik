import { component$, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
export { useHaulsSummaryLoader } from './loader';
import { useHaulsSummaryLoader } from './loader';
import { EditIcon } from '~/components/icons';

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const NC_RATE = 20.00; // $20.00 constant for now

// Helper function to get display text for off-duty reasons
function getOffDutyReasonDisplay(offDutyReason: string | null, settings: any): string {
  if (!offDutyReason) return 'Off Duty';

  // If it's a custom reason (Holiday: ... or Other: ...), return it as-is
  if (offDutyReason.startsWith('Holiday:') || offDutyReason.startsWith('Other:')) {
    return offDutyReason;
  }

  // Map standard reasons to their Settings fields
  const reasonMap: Record<string, string> = {
    'No Work': settings?.offDutyReasonNoWork || 'No Work',
    'Maintenance': settings?.offDutyReasonMaintenance || 'Maintenance',
    'Sick': settings?.offDutyReasonSick || 'Sick',
    'Vacation': settings?.offDutyReasonVacation || 'Vacation',
    'Weather': settings?.offDutyReasonWeather || 'Weather',
    'Personal': settings?.offDutyReasonPersonal || 'Personal',
    'Bereavement': settings?.offDutyReasonBereavement || 'Bereavement',
  };

  return reasonMap[offDutyReason] || offDutyReason;
}

export default component$(() => {
  const data = useHaulsSummaryLoader();
  const nav = useNavigate();

  // Handle error states by redirecting
  useVisibleTask$(({ track }) => {
    const result = track(() => data.value);
    if (result && 'error' in result) {
      console.log('HAULS REPORT ERROR:', result.error);
      // Show error message briefly then redirect
      setTimeout(() => {
        nav(result.error?.redirectTo || '/hauls');
      }, 3000); // 3 second delay to show the message
    }
  });

  const handlePrint = $(() => {
    window.print();
  });

  const handleBack = $(() => {
    if ('error' in data.value) return; // Prevent access if error state
    const returnUrl = `/hauls?driver=${data.value.driver.id}&startDate=${data.value.startDate}&endDate=${data.value.endDate}`;
    nav(returnUrl);
  });

  // Handle error states first
  if ('error' in data.value) {
    return (
      <div class="container mx-auto p-6">
        <div class="max-w-2xl mx-auto">
          <div class="card text-center">
            <div class="mb-6">
              <h1 class="text-2xl font-bold mb-4" style="color: rgb(var(--color-danger))">
                Report Error
              </h1>
              <p class="text-lg mb-4" style="color: rgb(var(--color-text-secondary))">
                {data.value.error?.message || 'An error occurred'}
              </p>
              <p class="text-sm" style="color: rgb(var(--color-text-tertiary))">
                Redirecting back to hauls page in 3 seconds...
              </p>
            </div>
            <div class="flex justify-center gap-4">
              <button
                class="btn btn-primary"
                onClick$={() => nav(data.value.error?.redirectTo || '/hauls')}
              >
                Go Back Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals for success state
  let totalFreightPay = 0;
  let totalDriverPay = 0;

  // Track unique workdays to avoid double-counting hours
  const seenWorkdayIds = new Set<number>();
  let totalChHours = 0;
  let totalNcHours = 0;

  const haulsWithCalculations = (data.value.allHauls || []).map((haul, index) => {
    const freightPay = haul.quantity * haul.rate;
    const driverPayRate = haul.loadType === 'enddump'
      ? data.value.driver?.endDumpPayRate || 0
      : data.value.driver?.flatBedPayRate || 0;
    const driverPay = freightPay * driverPayRate;

    totalFreightPay += freightPay;
    totalDriverPay += driverPay;

    // Only count hours once per workday
    if (!seenWorkdayIds.has(haul.workday.id)) {
      totalChHours += haul.workday.chHours;
      totalNcHours += haul.workday.ncHours;
      seenWorkdayIds.add(haul.workday.id);
    }

    // Determine if this is the first haul of the day
    const isFirstHaulOfDay = index === 0 ||
      formatDate((data.value.allHauls || [])[index - 1]?.dateHaul || '') !== formatDate(haul.dateHaul);

    return {
      ...haul,
      freightPay,
      driverPay,
      isFirstHaulOfDay,
    };
  });

  const ncTotal = totalNcHours * NC_RATE;
  const driverTotal = totalDriverPay + ncTotal;

  return (
    <>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background: white !important;
              color: black !important;
            }
            .print-page {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 1.5rem 1.5rem 1.5rem 2rem !important;
              box-shadow: none !important;
              max-width: none !important;
            }
          }

          .print-page {
            background: white;
            color: black;
            min-height: 100vh;
            padding: 1.5rem 1.5rem 1.5rem 2rem;
            max-width: 8.5in;
            margin: 0 auto;
          }

          .report-header {
            text-align: center;
          }

          .report-header h1 {
            font-size: 0.875rem;
            font-weight: bold;
            margin: 0;
            padding: 0;
          }

          .report-header h2 {
            font-size: 1.25rem;
            font-weight: bold;
            margin: 0;
            padding: 0;
            margin-bottom: 0.5rem;
          }

          .report-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
          }

          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
            font-size: 0.75rem;
          }

          .report-table th,
          .report-table td {
            border: 1px solid black;
            padding: 0.125rem 0.25rem;
            text-align: left;
            line-height: 1.2;
          }

          .report-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }

          .report-table td.number {
            text-align: right;
          }

          .summary-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 2rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid black;
            font-size: 0.8rem;
          }

          .summary-column > div {
            margin-bottom: 0.25rem;
          }

          .summary-column .bold {
            font-weight: bold;
          }
        `}
      </style>

      <div class="print-page">
        {/* Action Buttons - No Print */}
        <div class="no-print mb-4 flex gap-2">
          <button onClick$={handleBack} class="btn btn-secondary">
            ← Back
          </button>
          <button onClick$={handlePrint} class="btn btn-primary">
            🖨 Print
          </button>
        </div>

        {/* Report Header */}
        <div class="report-header">
          <h1>C&H Trucking</h1>
          <h2>Haul Summary</h2>
        </div>

        {/* Report Info Row */}
        <div class="report-info">
          <div>
            <strong>Driver:</strong> {data.value.driver.firstName} {data.value.driver.lastName}
          </div>
          <div>
            <strong>Period:</strong> {formatDate(data.value.startDate)} - {formatDate(data.value.endDate)}
          </div>
        </div>

        {/* Hauls Table */}
        {data.value.allHauls.length === 0 ? (
          <div style="text-align: center; margin: 2rem 0;">
            <p>No workdays or hauls recorded for this period</p>
          </div>
        ) : (
          <table class="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Cust</th>
                <th>Ref #</th>
                <th>CH Inv</th>
                <th>Material</th>
                <th>From</th>
                <th>To</th>
                <th>Qty</th>
                <th>Metric</th>
                <th>Rate</th>
                <th>CH Hrs</th>
                <th>NC Hrs</th>
                <th>Freight Pay</th>
                <th>Driver Pay</th>
                <th class="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {haulsWithCalculations.map((haul) => {
                // Check if this workday is marked as off-duty
                const isOffDuty = haul.workday.offDuty;
                // Check if this is a placeholder entry (negative ID means off-duty placeholder)
                const isPlaceholder = haul.id < 0;

                return (
                  <tr key={haul.id}>
                    <td>{formatDate(haul.dateHaul)}</td>
                    <td>{haul.customer || '—'}</td>
                    <td>{haul.loadRefNum || '—'}</td>
                    <td>{haul.chInvoice || '—'}</td>
                    <td>{isOffDuty ? '—' : haul.vendorProduct!.name}</td>
                    <td>{isOffDuty ? 'Off Duty' : `${haul.vendorProduct!.vendor.shortName}-${haul.vendorProduct!.vendorLocation.name}`}</td>
                    <td>{isOffDuty ? getOffDutyReasonDisplay(haul.workday.offDutyReason, data.value.settings) : haul.freightRoute!.destination}</td>
                    <td class="number">{isOffDuty ? '—' : haul.quantity.toFixed(2)}</td>
                    <td>{isOffDuty ? '—' : haul.rateMetric}</td>
                    <td class="number">{isOffDuty ? '—' : formatCurrency(haul.rate)}</td>
                    <td class="number">{haul.isFirstHaulOfDay ? haul.workday.chHours.toFixed(2) : '—'}</td>
                    <td class="number">{haul.isFirstHaulOfDay ? haul.workday.ncHours.toFixed(2) : '—'}</td>
                    <td class="number">{isOffDuty ? '—' : formatCurrency(haul.freightPay)}</td>
                    <td class="number">{isOffDuty ? '—' : formatCurrency(haul.driverPay)}</td>
                    <td class="no-print text-center">
                      {!isPlaceholder ? (
                        <a
                          href={`/hauls/edit/${haul.id}?returnTo=${encodeURIComponent(`/reports/hauls?driverId=${data.value.driver?.id}&startDate=${data.value.startDate}&endDate=${data.value.endDate}`)}`}
                          title="Edit Haul"
                          class="btn-icon btn-icon-primary"
                        >
                          <EditIcon size={14} />
                        </a>
                      ) : (
                        <a
                          href={`/workdays/edit/${haul.workday.id}?returnTo=${encodeURIComponent(`/reports/hauls?driverId=${data.value.driver?.id}&startDate=${data.value.startDate}&endDate=${data.value.endDate}`)}`}
                          title="Edit Workday"
                          class="btn-icon btn-icon-secondary"
                        >
                          <EditIcon size={14} />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Summary Section */}
        <div class="summary-section">
          {/* Left Column */}
          <div class="summary-column">
            <div><strong>C&H Hours:</strong> {totalChHours.toFixed(2)}</div>
            <div><strong>NC Hours:</strong> {totalNcHours.toFixed(2)}</div>
            <div><strong>NC Rate:</strong> {formatCurrency(NC_RATE)}</div>
          </div>

          {/* Middle Column */}
          <div class="summary-column">
            <div><strong>NC Reasons:</strong></div>
            {data.value.totals.ncReasonDetails.length > 0 ? (
              data.value.totals.ncReasonDetails.map((reason, index) => (
                <div key={index} style="margin-bottom: 0.125rem;">{reason}</div>
              ))
            ) : (
              <div>None</div>
            )}
          </div>

          {/* Right Column */}
          <div class="summary-column">
            <div><strong>Total Freight Pay:</strong> {formatCurrency(totalFreightPay)}</div>
            <div><strong>Driver Subtotal:</strong> {formatCurrency(totalDriverPay)}</div>
            <div><strong>NC Total:</strong> {formatCurrency(ncTotal)}</div>
            <div style="padding-top: 0.5rem; border-top: 1px solid black; margin-top: 0.5rem;">
              <strong>Driver Total:</strong> {formatCurrency(driverTotal)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});