import { component$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import PageTitle from '~/components/PageTitle';
import { NavLink } from '~/components/NavLink';

export default component$(() => {
  const loc = useLocation();

  // Parse the breakdownData from URL params
  const breakdownDataParam = loc.url.searchParams.get('breakdownData');
  const outboundParam = loc.url.searchParams.get('outbound');
  const isOutbound = outboundParam === 'true';

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

      {!breakdownData ? (
        <div class="card no-print">
          <p style="color: rgb(var(--color-text-secondary))">
            No breakdown data found. Please go back to the calculator and try again.
          </p>
        </div>
      ) : (
        <>
          {/* Debug section - hidden on print */}
          <div class="card space-y-4 no-print">
            <h3 class="font-semibold" style="color: rgb(var(--color-text-primary))">
              Preview (this section will not print)
            </h3>
            <details class="cursor-pointer">
              <summary class="font-semibold mb-3" style="color: rgb(var(--color-text-primary))">
                Raw Data (for debugging)
              </summary>
              <pre
                class="p-4 rounded-lg text-xs overflow-auto"
                style="background-color: rgb(var(--color-bg-secondary)); color: rgb(var(--color-text-primary)); max-height: 400px;"
              >
                {JSON.stringify(breakdownData, null, 2)}
              </pre>
            </details>
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
          /* Hide elements when printing */
          @media print {
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
