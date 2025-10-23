import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import PageTitle from '~/components/PageTitle';
import type { Driver } from '~/types/driver';

export default component$(() => {
  const loc = useLocation();

  // Parse the breakdownData from URL params
  const breakdownDataParam = loc.url.searchParams.get('breakdownData');
  const outboundParam = loc.url.searchParams.get('outbound');
  const isOutbound = outboundParam === 'true';

  // Signals for form data and driver info
  const includeHeader = useSignal<boolean>(true);
  const outboundTruck = useSignal<boolean>(isOutbound); // Initialize from URL param
  const drivers = useSignal<Driver[]>([]);
  const selectedDriver = useSignal<Driver | null>(null);
  const selectedDate = useSignal<string>(new Date().toISOString().split('T')[0]); // Default to today
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


  // Fetch drivers and set default values
  useVisibleTask$(async () => {
    try {
      const response = await fetch('/api/drivers');
      const data = await response.json();
      if (data.success && data.drivers) {
        drivers.value = data.drivers;
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      drivers.value = [];
    }

    // Calculate initial prefilled values with today's date
    updatePrintValues();
  });

  // Function to update print values when driver or date changes
  const updatePrintValues = $(() => {
    const currentDate = selectedDate.value;
    
    // Top-left line 1: "#<defaultTruck> <driver firstName>"
    if (selectedDriver.value) {
      const truck = selectedDriver.value.defaultTruck || 'N/A';
      topLeftLine1.value = `#${truck} ${selectedDriver.value.firstName}`;
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
    topLeftLine3.value = !outboundTruck.value ? '--C&H Yard--' : '';

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
          <a href="/calculators/cost" class="btn btn-ghost">
            Back to Calculator
          </a>
        </div>
      </div>

      {/* Print Information Form - Hidden on Print */}
      <div class="card space-y-4 no-print">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold" style="color: rgb(var(--color-text-primary))">
            Print Information
          </h3>
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <input
                id="outboundTruck"
                type="checkbox"
                checked={outboundTruck.value}
                onChange$={(e) => {
                  outboundTruck.value = (e.target as HTMLInputElement).checked;
                  updatePrintValues();
                }}
              />
              <label
                for="outboundTruck"
                class="text-sm font-medium"
                style="color: rgb(var(--color-text-primary))"
              >
                Outbound Truck
              </label>
            </div>
            <div class="flex items-center gap-2">
              <input
                id="includeHeader"
                type="checkbox"
                checked={includeHeader.value}
                onChange$={(e) => {
                  includeHeader.value = (e.target as HTMLInputElement).checked;
                }}
              />
              <label
                for="includeHeader"
                class="text-sm font-medium"
                style="color: rgb(var(--color-text-primary))"
              >
                Include Header
              </label>
            </div>
          </div>
        </div>

        {/* Driver Selection */}
        <div class="mb-4">
          <label
            for="driver"
            class="block text-sm font-medium mb-2"
            style="color: rgb(var(--color-text-secondary))"
          >
            Driver
          </label>
          <select
            id="driver"
            value={selectedDriver.value?.id || ''}
            disabled={!includeHeader.value}
            onChange$={(_, el) => {
              const driverId = parseInt(el.value) || null;
              selectedDriver.value = driverId ? drivers.value.find(d => d.id === driverId) || null : null;
              updatePrintValues();
            }}
            class={`w-full ${!includeHeader.value ? 'disabled-input' : ''}`}
          >
            <option value="">Select a driver...</option>
            {drivers.value.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {`${driver.firstName} ${driver.lastName}${driver.defaultTruck ? ` (Truck ${driver.defaultTruck})` : ''}`}
              </option>
            ))}
          </select>
        </div>

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
                disabled={!includeHeader.value}
                onInput$={(e) => {
                  topLeftLine1.value = (e.target as HTMLInputElement).value;
                }}
                class={`w-full ${!includeHeader.value ? 'disabled-input' : ''}`}
                placeholder="#[Truck] [Driver]"
              />
            </div>

            <div>
              <label
                for="ticketDate"
                class="block text-sm font-medium mb-1"
                style="color: rgb(var(--color-text-secondary))"
              >
                Ticket Date
              </label>
              <input
                id="ticketDate"
                type="date"
                value={selectedDate.value}
                disabled={!includeHeader.value}
                onInput$={(e) => {
                  selectedDate.value = (e.target as HTMLInputElement).value;
                  updatePrintValues();
                }}
                class={`w-full ${!includeHeader.value ? 'disabled-input' : ''}`}
              />
            </div>

            {!outboundTruck.value && (
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
                  disabled={!includeHeader.value}
                  onInput$={(e) => {
                    topLeftLine3.value = (e.target as HTMLInputElement).value;
                  }}
                  class={`w-full ${!includeHeader.value ? 'disabled-input' : ''}`}
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
                disabled={!includeHeader.value}
                onInput$={(e) => {
                  topRightDueDate.value = (e.target as HTMLInputElement).value;
                }}
                class={`w-full ${!includeHeader.value ? 'disabled-input' : ''}`}
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

          {/* Top Print Information - Only visible when printing and checkbox is checked */}
          {includeHeader.value && (
            <div class="print-top-info">
              <div class="print-top-left">
                {topLeftLine1.value && (
                  <div class="print-top-line">{topLeftLine1.value}</div>
                )}
                {topLeftLine2.value && (
                  <div class="print-top-line">{topLeftLine2.value}</div>
                )}
                {topLeftLine3.value && !outboundTruck.value && (
                  <div class="print-top-line">{topLeftLine3.value}</div>
                )}
              </div>
              <div class="print-top-right">
                {topRightDueDate.value && (
                  <div class="print-top-line">{topRightDueDate.value}</div>
                )}
              </div>
            </div>
          )}

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
                  {outboundTruck.value && (
                    <div class="print-outbound-label">
                      <strong>Outbound Truckload</strong>
                    </div>
                  )}
                  <div>{formatNumber(tons)} T</div>
                  {!outboundTruck.value && <div>= {formatNumber(yards)} yds</div>}
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
          /* Disabled input styling */
          .disabled-input {
            background-color: rgb(248, 250, 252) !important;
            opacity: 0.6;
          }

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
