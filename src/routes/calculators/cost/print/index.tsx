import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import PageTitle from '~/components/PageTitle';
import { NavLink } from '~/components/NavLink';
import type { Driver } from '~/types/driver';

export default component$(() => {
  const loc = useLocation();

  // Parse the breakdownData from URL params
  const breakdownDataParam = loc.url.searchParams.get('breakdownData');
  const outboundParam = loc.url.searchParams.get('outbound');
  const driverIdParam = loc.url.searchParams.get('driverId');
  const dateParam = loc.url.searchParams.get('date');
  const isOutbound = outboundParam === 'true';

  // Signals for form data and driver info
  const driver = useSignal<Driver | null>(null);
  const topLeftLine1 = useSignal<string>('');
  const topLeftLine2 = useSignal<string>('');
  const topLeftLine3 = useSignal<string>('');
  const topRightDueDate = useSignal<string>('');

  let breakdownData: any = null;

  try {
    if (breakdownDataParam) {
      breakdownData = JSON.parse(breakdownDataParam);
    }
  } catch (error) {
    console.error('Failed to parse breakdown data:', error);
  }

  // Format number to 2 decimals
  const formatNumber = (num: number): string => {
    return num?.toFixed(2) || '0.00';
  };

  // Format currency
  const formatCurrency = (num: number): string => {
    return `$${formatNumber(num)}`;
  };

  // Calculations from breakdownData
  const productCost = breakdownData?.product || 0;
  const freightCost = breakdownData?.freightToYard || 0;
  const chtFuelSurcharge = breakdownData?.chtFuelSurcharge || 0;
  const tons = breakdownData?.tons || 0;
  const costPerTon = breakdownData?.costPerTon || 0;
  const costPerYard = breakdownData?.costPerYard || 0;
  const yards = breakdownData?.yards || 0;

  const productTotal = productCost * tons;
  const freightTotal = freightCost * tons;
  const chtFscTotal = chtFuelSurcharge * tons;
  const totalCost = costPerTon * tons;
  const totalCostWithoutFsc = totalCost - chtFscTotal;
  const vendorBilling = productTotal;
  const chtBilling = freightTotal + chtFscTotal;


  // Fetch driver data and calculate prefilled values
  useVisibleTask$(async () => {
    if (driverIdParam) {
      try {
        const response = await fetch('/api/drivers');
        const data = await response.json();
        if (data.success && data.drivers) {
          const selectedDriver = data.drivers.find((d: Driver) => d.id === parseInt(driverIdParam));
          if (selectedDriver) {
            driver.value = selectedDriver;
          }
        }
      } catch (error) {
        console.error('Failed to fetch driver:', error);
      }
    }

    // Calculate prefilled values
    const currentDate = dateParam || new Date().toISOString().split('T')[0];
    
    // Top-left line 1: "#<defaultTruck> <driver firstName>"
    if (driver.value) {
      const truck = driver.value.defaultTruck || 'N/A';
      topLeftLine1.value = `#${truck} ${driver.value.firstName}`;
    } else {
      topLeftLine1.value = '#[Truck] [Driver]';
    }

    // Top-left line 2: date in MM/DD/YY (inline formatting) - avoid timezone issues
    const [yearStr, monthStr, dayStr] = currentDate.split('-');
    const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr)); // Use local timezone
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString().slice(-2);
    topLeftLine2.value = `${month}/${day}/${year}`;

    // Top-left line 3: "--C&H Yard--" (only if NOT outbound truck)
    topLeftLine3.value = !isOutbound ? '--C&H Yard--' : '';

    // Top-right: due date (MM/DD format, +1 month -1 day from line 2) - inline calculation
    const dueDateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr)); // Use same date object to avoid timezone issues
    dueDateObj.setMonth(dueDateObj.getMonth() + 1); // Add 1 month
    dueDateObj.setDate(dueDateObj.getDate() - 1);   // Subtract 1 day
    const dueMonth = (dueDateObj.getMonth() + 1).toString().padStart(2, '0');
    const dueDay = dueDateObj.getDate().toString().padStart(2, '0');
    topRightDueDate.value = `${dueMonth}/${dueDay}`;
  });

  return (
    <section class="space-y-6">
      {/* Header with buttons - will be hidden on print */}
      <div class="flex items-center justify-between mb-6 no-print">
        <PageTitle text="Cost Calculator - Print Preview" />
        <div class="flex gap-3">
          <button class="btn btn-primary" onClick$={() => window.print()}>
            Print
          </button>
          <NavLink href="/calculators/cost">Back to Calculator</NavLink>
        </div>
      </div>

      {/* Print Information Form - Hidden on Print */}
      <div class="card space-y-4 no-print">
        <h3 class="font-semibold" style="color: rgb(var(--color-text-primary))">
          Print Information (Edit as needed)
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Top Left Print Info */}
          <div class="space-y-4">
            <h4 class="font-medium text-sm" style="color: rgb(var(--color-text-secondary))">
              Top-Left Print Area
            </h4>
            
            <div>
              <label
                for="topLeftLine1"
                class="block text-sm font-medium mb-1"
                style="color: rgb(var(--color-text-secondary))"
              >
                Line 1 (Truck & Driver)
              </label>
              <input
                id="topLeftLine1"
                type="text"
                value={topLeftLine1.value}
                onInput$={(e) => {
                  topLeftLine1.value = (e.target as HTMLInputElement).value;
                }}
                class="w-full"
                placeholder="#[Truck] [Driver]"
              />
            </div>

            <div>
              <label
                for="topLeftLine2"
                class="block text-sm font-medium mb-1"
                style="color: rgb(var(--color-text-secondary))"
              >
                Line 2 (Date MM/DD/YY)
              </label>
              <input
                id="topLeftLine2"
                type="text"
                value={topLeftLine2.value}
                onInput$={(e) => {
                  topLeftLine2.value = (e.target as HTMLInputElement).value;
                  // Auto-update due date when this changes
                  try {
                    const [month, day, year] = topLeftLine2.value.split('/');
                    if (month && day && year) {
                      const fullYear = year.length === 2 ? `20${year}` : year;
                      const dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                      // Inline calculation: +1 month -1 day
                      const date = new Date(dateStr);
                      date.setMonth(date.getMonth() + 1); // Add 1 month
                      date.setDate(date.getDate() - 1);   // Subtract 1 day
                      const dueDateMonth = (date.getMonth() + 1).toString().padStart(2, '0');
                      const dueDateDay = date.getDate().toString().padStart(2, '0');
                      topRightDueDate.value = `${dueDateMonth}/${dueDateDay}`;
                    }
                  } catch {
                    // Ignore parsing errors
                  }
                }}
                class="w-full"
                placeholder="MM/DD/YY"
              />
            </div>

            {!isOutbound && (
              <div>
                <label
                  for="topLeftLine3"
                  class="block text-sm font-medium mb-1"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Line 3 (C&H Yard - shown when not outbound)
                </label>
                <input
                  id="topLeftLine3"
                  type="text"
                  value={topLeftLine3.value}
                  onInput$={(e) => {
                    topLeftLine3.value = (e.target as HTMLInputElement).value;
                  }}
                  class="w-full"
                  placeholder="--C&H Yard--"
                />
              </div>
            )}
          </div>

          {/* Right Column - Top Right Print Info */}
          <div class="space-y-4">
            <h4 class="font-medium text-sm" style="color: rgb(var(--color-text-secondary))">
              Top-Right Print Area
            </h4>
            
            <div>
              <label
                for="topRightDueDate"
                class="block text-sm font-medium mb-1"
                style="color: rgb(var(--color-text-secondary))"
              >
                Due Date (MM/DD, auto-calculated +1 month -1 day)
              </label>
              <input
                id="topRightDueDate"
                type="text"
                value={topRightDueDate.value}
                onInput$={(e) => {
                  topRightDueDate.value = (e.target as HTMLInputElement).value;
                }}
                class="w-full"
                placeholder="MM/DD"
              />
              <p class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                Automatically calculated as Date + 1 month - 1 day
              </p>
            </div>
          </div>
        </div>
      </div>

      {!breakdownData ? (
        <div class="card no-print">
          <p style="color: rgb(var(--color-text-secondary))">
            No breakdown data found. Please go back to the calculator and try again.
          </p>
        </div>
      ) : (
        <>

          {/* Top Print Information - Only visible when printing */}
          <div class="print-top-info">
            <div class="print-top-left">
              {topLeftLine1.value && (
                <div class="print-top-line">{topLeftLine1.value}</div>
              )}
              {topLeftLine2.value && (
                <div class="print-top-line">{topLeftLine2.value}</div>
              )}
              {topLeftLine3.value && !isOutbound && (
                <div class="print-top-line">{topLeftLine3.value}</div>
              )}
            </div>
            <div class="print-top-right">
              {topRightDueDate.value && (
                <div class="print-top-line">{topRightDueDate.value}</div>
              )}
            </div>
          </div>

          {/* Print section - positioned at bottom of page */}
          <div class="print-section">
            <div class="print-content">
              {/* Column 0 - Main Details */}
              <div class="print-col print-col-left">
                {/* Product Name */}
                <div class="print-product-name">
                  {breakdownData.material.name} ({breakdownData.vendor.name}: {breakdownData.location})
                </div>

                {/* Cost per Ton/Yard */}
                <div class="print-costs">
                  <div>{formatCurrency(costPerTon)} /t</div>
                  <div>{formatCurrency(costPerYard)} /yd</div>
                </div>

                {/* CHT FSC */}
                <div class="print-fsc">
                  CHT FSC: {formatCurrency(chtFuelSurcharge)} ({formatCurrency(chtFscTotal)})
                </div>

                {/* P and F breakdown */}
                <div class="print-breakdown">
                  <div>P: {formatCurrency(productCost)} ({formatCurrency(productTotal)})</div>
                  <div>F: {formatCurrency(freightCost)} ({formatCurrency(freightTotal)})</div>
                  <div>+ {formatCurrency(chtFscTotal)} FSC</div>
                </div>

                {/* Total */}
                <div class="print-total">
                  <strong>Total: {formatCurrency(totalCost)}</strong> ({formatCurrency(totalCostWithoutFsc)} w/o FSC)
                </div>
              </div>

              {/* Column 1 - Tons/Yards */}
              <div class="print-col print-col-center">
                <div class="print-quantity">
                  {isOutbound && (
                    <div class="print-outbound-label">
                      <strong>Outbound Truckload</strong>
                    </div>
                  )}
                  <div>{formatNumber(tons)} T</div>
                  {!isOutbound && <div>= {formatNumber(yards)} yds</div>}
                </div>
              </div>

              {/* Column 2 - Billing */}
              <div class="print-col print-col-right">
                <div class="print-billing-title">
                  <strong>BILLING</strong>
                </div>

                <div class="print-billing">
                  <div class="print-billing-row">
                    <span><strong>Vendor:</strong></span>
                    <span>{formatCurrency(vendorBilling)}</span>
                  </div>
                  <div class="print-billing-row">
                    <span><strong>CHT:</strong></span>
                    <span>{formatCurrency(chtBilling)}</span>
                  </div>
                  <div class="print-billing-row">
                    <span><strong>Total Cost:</strong></span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>
        {`
          /* Print top information styling */
          .print-top-info {
            display: none; /* Hidden by default */
          }

          .print-top-line {
            font-size: 16pt;
            font-weight: bold;
            line-height: 1.2;
            margin-bottom: 0.2rem;
          }

          /* Hide elements when printing */
          @media print {
            /* Show top info only when printing */
            .print-top-info {
              display: flex;
              justify-content: space-between;
              position: fixed;
              top: 0.2in;
              left: 0.4in;
              right: 0.4in;
              z-index: 1000;
            }

            .print-top-left {
              display: flex;
              flex-direction: column;
            }

            .print-top-right {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
            }
            nav,
            .no-print,
            button,
            a {
              display: none !important;
            }

            body {
              background: white;
              color: black;
            }

            /* Ensure print section is at bottom of page */
            .print-section {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              margin: 0.5rem;
            }
          }

          /* Print section styling */
          .print-section {
            margin-top: 4rem;
            padding: 0.5rem;
          }

          .print-content {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            border-top: 1px solid #333;
            border-bottom: 1px solid #333;
            font-size: 0.95rem;
            line-height: 1.4;
          }

          .print-col {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .print-col-left {
            border-right: 1px solid #333;
          }

          .print-col-center {
            border-right: 1px solid #333;
            min-width: 120px;
            max-width: 140px;
            justify-content: flex-start;
            align-items: center;
            text-align: center;
          }

          .print-col-right {
            /* No right border */
          }

          /* Column 0 (Left) Styles */
          .print-product-name {
            font-weight: bold;
            font-size: 1rem;
          }

          .print-costs {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .print-fsc {
            font-size: 0.9rem;
          }

          .print-breakdown {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }


          .print-total {
            font-size: 1rem;
            margin-top: 0.25rem;
          }

          /* Column 1 (Center) Styles */
          .print-quantity {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            font-size: 1rem;
          }

          .print-outbound-label {
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }

          /* Column 2 (Right) Styles */
          .print-billing-title {
            font-size: 1rem;
            margin-bottom: 0.25rem;
          }

          .print-billing {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .print-billing-row {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
          }

          /* Print-specific adjustments */
          @media print {
            .print-content {
              font-size: 0.9rem;
            }

            .print-section {
              page-break-inside: avoid;
            }
          }
        `}
      </style>
    </section>
  );
});
