import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import PageTitle from '~/components/PageTitle';

type Shape =
  | 'null'
  | 'square'
  | 'rectangle'
  | 'rectangleBorder'
  | 'circle'
  | 'circleBorder'
  | 'annulus'
  | 'triangle'
  | 'trapezoid';
type Metric = 'in' | 'ft' | 'yd' | 'mm' | 'cm' | 'm';

// Unit conversion factors to feet
const unitToFeet: Record<Metric, number> = {
  in: 1 / 12,
  ft: 1,
  yd: 3,
  mm: 1 / 304.8,
  cm: 1 / 30.48,
  m: 3.28084,
};

interface InputField {
  name: string;
  label: string;
  defaultUnit: Metric;
}

const shapeInputs: Record<Exclude<Shape, 'null'>, InputField[]> = {
  square: [
    { name: 'sideLength', label: 'Side Length', defaultUnit: 'ft' },
    { name: 'depth', label: 'Depth', defaultUnit: 'in' },
  ],
  rectangle: [
    { name: 'length', label: 'Length', defaultUnit: 'ft' },
    { name: 'width', label: 'Width', defaultUnit: 'ft' },
    { name: 'depth', label: 'Depth', defaultUnit: 'in' },
  ],
  rectangleBorder: [
    { name: 'length', label: 'Length', defaultUnit: 'ft' },
    { name: 'width', label: 'Width', defaultUnit: 'ft' },
    { name: 'borderWidth', label: 'Border Width', defaultUnit: 'ft' },
    { name: 'depth', label: 'Depth', defaultUnit: 'in' },
  ],
  circle: [
    { name: 'diameter', label: 'Diameter', defaultUnit: 'ft' },
    { name: 'depth', label: 'Depth', defaultUnit: 'in' },
  ],
  circleBorder: [
    { name: 'innerDiameter', label: 'Inner Diameter', defaultUnit: 'ft' },
    { name: 'borderWidth', label: 'Border Width', defaultUnit: 'ft' },
    { name: 'depth', label: 'Depth', defaultUnit: 'in' },
  ],
  annulus: [
    { name: 'innerDiameter', label: 'Inner Diameter', defaultUnit: 'ft' },
    { name: 'outerDiameter', label: 'Outer Diameter', defaultUnit: 'ft' },
    { name: 'depth', label: 'Depth', defaultUnit: 'in' },
  ],
  triangle: [
    { name: 'sideA', label: 'Side A', defaultUnit: 'ft' },
    { name: 'sideB', label: 'Side B', defaultUnit: 'ft' },
    { name: 'sideC', label: 'Side C', defaultUnit: 'ft' },
    { name: 'depth', label: 'Depth', defaultUnit: 'in' },
  ],
  trapezoid: [
    { name: 'height', label: 'Height', defaultUnit: 'ft' },
    { name: 'sideA', label: 'Side A', defaultUnit: 'ft' },
    { name: 'sideB', label: 'Side B', defaultUnit: 'ft' },
    { name: 'depth', label: 'Depth', defaultUnit: 'in' },
  ],
};

export default component$(() => {
  const shapeChosen = useSignal<Shape>('null');
  const possible_shapes = {
    null: 'Choose shape...',
    square: 'Square',
    rectangle: 'Rectangle',
    rectangleBorder: 'Rectangle Border',
    circle: 'Circle',
    circleBorder: 'Circle Border',
    annulus: 'Annulus',
    triangle: 'Triangle',
    trapezoid: 'Trapezoid',
  };

  // Input values and units
  const inputValues = useSignal<Record<string, string>>({});
  const inputUnits = useSignal<Record<string, Metric>>({});
  const quantity = useSignal('1');
  const result = useSignal<number | null>(null);
  const canvasRef = useSignal<HTMLCanvasElement>();
  const themeVersion = useSignal(0);

  // Watch for theme changes
  useVisibleTask$(() => {
    const observer = new MutationObserver(() => {
      themeVersion.value++;
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });

    return () => observer.disconnect();
  });

  // Handle unit change with conversion
  const handleUnitChange = $((fieldName: string, newUnit: Metric) => {
    const currentValue = parseFloat(inputValues.value[fieldName] || '0');
    const currentUnit = inputUnits.value[fieldName];

    if (currentValue && currentUnit) {
      // Convert inline: currentUnit -> feet -> newUnit
      const inFeet = currentValue * unitToFeet[currentUnit];
      const converted = inFeet / unitToFeet[newUnit];

      inputValues.value = {
        ...inputValues.value,
        [fieldName]: converted.toFixed(4),
      };
    }

    inputUnits.value = { ...inputUnits.value, [fieldName]: newUnit };
  });

  // Initialize inputs when shape changes
  const handleShapeChange = $((newShape: Shape) => {
    shapeChosen.value = newShape;

    if (newShape !== 'null') {
      const fields = shapeInputs[newShape];
      const newValues: Record<string, string> = {};
      const newUnits: Record<string, Metric> = {};

      fields.forEach((field) => {
        newValues[field.name] = inputValues.value[field.name] || '';
        newUnits[field.name] =
          inputUnits.value[field.name] || field.defaultUnit;
      });

      inputValues.value = newValues;
      inputUnits.value = newUnits;
    }

    result.value = null;
  });

  // Calculate volume in cubic yards
  const calculate = $(() => {
    if (shapeChosen.value === 'null') return;

    const values: Record<string, number> = {};
    const fields = shapeInputs[shapeChosen.value];

    // Convert all inputs to feet
    for (const field of fields) {
      const value = parseFloat(inputValues.value[field.name] || '0');
      const unit = inputUnits.value[field.name];
      values[field.name] = value * unitToFeet[unit];
    }

    const qty = parseFloat(quantity.value) || 1;
    let area = 0;

    switch (shapeChosen.value) {
      case 'square': {
        const { sideLength, depth } = values;
        area = sideLength * sideLength;
        result.value = ((depth * area) / 27) * qty;
        break;
      }
      case 'rectangle': {
        const { length, width, depth } = values;
        area = length * width;
        result.value = ((depth * area) / 27) * qty;
        break;
      }
      case 'rectangleBorder': {
        const { length, width, borderWidth, depth } = values;
        const innerArea = length * width;
        const totalArea =
          (length + 2 * borderWidth) * (width + 2 * borderWidth);
        area = totalArea - innerArea;
        result.value = ((depth * area) / 27) * qty;
        break;
      }
      case 'circle': {
        const { diameter, depth } = values;
        area = Math.PI * Math.pow(diameter / 2, 2);
        result.value = ((depth * area) / 27) * qty;
        break;
      }
      case 'circleBorder': {
        const { innerDiameter, borderWidth, depth } = values;
        const outerDiameter = innerDiameter + 2 * borderWidth;
        const outerArea = Math.PI * Math.pow(outerDiameter / 2, 2);
        const innerArea = Math.PI * Math.pow(innerDiameter / 2, 2);
        area = outerArea - innerArea;
        result.value = ((depth * area) / 27) * qty;
        break;
      }
      case 'annulus': {
        const { innerDiameter, outerDiameter, depth } = values;
        const outerArea = Math.PI * Math.pow(outerDiameter / 2, 2);
        const innerArea = Math.PI * Math.pow(innerDiameter / 2, 2);
        area = outerArea - innerArea;
        result.value = ((depth * area) / 27) * qty;
        break;
      }
      case 'triangle': {
        const { sideA, sideB, sideC, depth } = values;
        const s = (sideA + sideB + sideC) / 2;
        area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
        result.value = ((depth * area) / 27) * qty;
        break;
      }
      case 'trapezoid': {
        const { height, sideA, sideB, depth } = values;
        area = ((sideA + sideB) / 2) * height;
        result.value = ((depth * area) / 27) * qty;
        break;
      }
    }
  });

  // Clear all inputs
  const clearInputs = $(() => {
    inputValues.value = {};
    inputUnits.value = {};
    quantity.value = '1';
    result.value = null;
  });

  // Draw shape on canvas
  useVisibleTask$(({ track }) => {
    track(() => shapeChosen.value);
    track(() => inputValues.value);
    track(() => inputUnits.value);
    track(() => themeVersion.value); // Track theme changes

    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (shapeChosen.value === 'null') {
      ctx.fillStyle = 'rgb(156, 163, 175)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select a shape', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Get theme-aware text color from CSS custom property
    const computedStyle = getComputedStyle(canvas);
    const textColorRgb = computedStyle.getPropertyValue('--color-text-primary').trim();
    const textColor = `rgb(${textColorRgb})`;

    // Set drawing styles
    ctx.strokeStyle = 'rgb(59, 130, 246)';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 3;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const getDisplayValue = (fieldName: string) => {
      const value = inputValues.value[fieldName];
      const unit = inputUnits.value[fieldName];
      return value && unit ? `${value}${unit}` : '';
    };

    switch (shapeChosen.value) {
      case 'square': {
        const size = 150;
        ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
        ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);

        const label = getDisplayValue('sideLength');
        if (label) {
          ctx.fillStyle = textColor;
          // Top label
          ctx.fillText(label, centerX, centerY - size / 2 - 15);
          // Right side label (mirrored)
          ctx.save();
          ctx.translate(centerX + size / 2 + 15, centerY);
          ctx.rotate(Math.PI / 2);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
        break;
      }
      case 'rectangle': {
        const width = 180;
        const height = 120;
        ctx.fillRect(centerX - width / 2, centerY - height / 2, width, height);
        ctx.strokeRect(
          centerX - width / 2,
          centerY - height / 2,
          width,
          height,
        );

        ctx.fillStyle = textColor;
        const lengthLabel = getDisplayValue('length');
        const widthLabel = getDisplayValue('width');
        if (lengthLabel)
          ctx.fillText(lengthLabel, centerX, centerY - height / 2 - 15);
        if (widthLabel) {
          ctx.save();
          ctx.translate(centerX - width / 2 - 35, centerY);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(widthLabel, 0, 0);
          ctx.restore();
        }
        break;
      }
      case 'rectangleBorder': {
        const outerWidth = 200;
        const outerHeight = 140;
        const borderW = 28;

        // Draw border with green fill
        ctx.fillStyle = 'rgba(34, 139, 120, 0.5)'; // Greenish-blue for border
        ctx.fillRect(
          centerX - outerWidth / 2,
          centerY - outerHeight / 2,
          outerWidth,
          outerHeight,
        );
        ctx.strokeStyle = 'rgb(59, 130, 246)';
        ctx.strokeRect(
          centerX - outerWidth / 2,
          centerY - outerHeight / 2,
          outerWidth,
          outerHeight,
        );

        // Inner rectangle (clear area)
        ctx.clearRect(
          centerX - outerWidth / 2 + borderW,
          centerY - outerHeight / 2 + borderW,
          outerWidth - 2 * borderW,
          outerHeight - 2 * borderW,
        );
        ctx.strokeRect(
          centerX - outerWidth / 2 + borderW,
          centerY - outerHeight / 2 + borderW,
          outerWidth - 2 * borderW,
          outerHeight - 2 * borderW,
        );

        ctx.fillStyle = textColor;
        const lengthLabel = getDisplayValue('length');
        const widthLabel = getDisplayValue('width');
        const borderLabel = getDisplayValue('borderWidth');

        // Length label (horizontal at top edge)
        if (lengthLabel)
          ctx.fillText(lengthLabel, centerX, centerY - outerHeight / 2 - 15);

        // Width label (vertical on left)
        if (widthLabel) {
          ctx.save();
          ctx.translate(centerX - outerWidth / 2 - 40, centerY);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(widthLabel, 0, 0);
          ctx.restore();
        }

        // Border width label (centered horizontally in top border area)
        if (borderLabel) {
          ctx.font = '14px sans-serif';
          ctx.fillText(
            borderLabel,
            centerX,
            centerY - outerHeight / 2 + borderW / 2,
          );
          ctx.font = '16px sans-serif';
        }
        break;
      }
      case 'circle': {
        const radius = 90;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgb(59, 130, 246)';
        ctx.stroke();

        // Draw dashed diameter line
        ctx.strokeStyle = 'rgb(239, 68, 68)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX + radius, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Diameter label (dark text with more margin from line)
        const diamLabel = getDisplayValue('diameter');
        if (diamLabel) {
          ctx.fillStyle = textColor;
          ctx.fillText(diamLabel, centerX, centerY - 10);
        }
        break;
      }
      case 'circleBorder': {
        const outerRadius = 90;
        const innerRadius = 55;

        // Outer circle with green border fill
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(34, 139, 120, 0.5)'; // Greenish-blue for border
        ctx.fill();
        ctx.strokeStyle = 'rgb(59, 130, 246)';
        ctx.stroke();

        // Inner circle (clear area)
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.clearRect(
          centerX - innerRadius,
          centerY - innerRadius,
          innerRadius * 2,
          innerRadius * 2,
        );
        ctx.strokeStyle = 'rgb(59, 130, 246)';
        ctx.stroke();

        // Draw red dashed inner diameter line
        ctx.strokeStyle = 'rgb(239, 68, 68)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX - innerRadius, centerY);
        ctx.lineTo(centerX + innerRadius, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        const innerLabel = getDisplayValue('innerDiameter');
        const borderLabel = getDisplayValue('borderWidth');

        // Inner diameter label (dark text above line)
        if (innerLabel) {
          ctx.fillStyle = textColor;
          ctx.fillText(innerLabel, centerX, centerY - 10);
        }

        // Border width label (dark text inside the border area)
        if (borderLabel) {
          ctx.fillStyle = textColor;
          ctx.font = '14px sans-serif';
          // Position at angle in the border area (upper right)
          const angle = Math.PI / 4; // 45 degrees
          const labelRadius = (innerRadius + outerRadius) / 2;
          const labelX = centerX + Math.cos(angle) * labelRadius;
          const labelY = centerY - Math.sin(angle) * labelRadius;
          ctx.fillText(borderLabel, labelX, labelY);
          ctx.font = '16px sans-serif';
        }
        break;
      }
      case 'annulus': {
        const outerRadius = 90;
        const innerRadius = 55;

        // Outer circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgb(59, 130, 246)';
        ctx.stroke();

        // Inner circle (clear area)
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.clearRect(
          centerX - innerRadius,
          centerY - innerRadius,
          innerRadius * 2,
          innerRadius * 2,
        );
        ctx.strokeStyle = 'rgb(59, 130, 246)';
        ctx.stroke();

        // Draw red dashed inner diameter line (through center)
        ctx.strokeStyle = 'rgb(239, 68, 68)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX - innerRadius, centerY);
        ctx.lineTo(centerX + innerRadius, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw yellow dashed outer diameter line (below the circle)
        const outerLineY = centerY + outerRadius + 20;
        ctx.strokeStyle = 'rgb(234, 179, 8)'; // Yellow
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX - outerRadius, outerLineY);
        ctx.lineTo(centerX + outerRadius, outerLineY);
        ctx.stroke();
        ctx.setLineDash([]);

        const innerLabel = getDisplayValue('innerDiameter');
        const outerLabel = getDisplayValue('outerDiameter');

        // Inner diameter label (red text above center line)
        if (innerLabel) {
          ctx.fillStyle = 'rgb(239, 68, 68)';
          ctx.fillText(innerLabel, centerX, centerY - 10);
        }

        // Outer diameter label (yellow text below the outer diameter line)
        if (outerLabel) {
          ctx.fillStyle = 'rgb(234, 179, 8)';
          ctx.fillText(outerLabel, centerX, outerLineY + 18);
        }
        break;
      }
      case 'triangle': {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 90);
        ctx.lineTo(centerX - 105, centerY + 75);
        ctx.lineTo(centerX + 105, centerY + 75);
        ctx.closePath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgb(59, 130, 246)';
        ctx.stroke();

        ctx.fillStyle = textColor;
        const aLabel = getDisplayValue('sideA');
        const bLabel = getDisplayValue('sideB');
        const cLabel = getDisplayValue('sideC');

        // Outside measurement labels
        if (aLabel) ctx.fillText(aLabel, centerX, centerY + 95);
        if (bLabel) ctx.fillText(bLabel, centerX + 85, centerY - 5);
        if (cLabel) ctx.fillText(cLabel, centerX - 85, centerY - 5);

        // Inside letter labels (comfortably inside the triangle)
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText('A', centerX, centerY + 50); // Bottom center
        ctx.fillText('B', centerX + 50, centerY + 10); // Right side (moved inward)
        ctx.fillText('C', centerX - 50, centerY + 10); // Left side (moved inward)
        ctx.font = '16px sans-serif';
        break;
      }
      case 'trapezoid': {
        ctx.beginPath();
        ctx.moveTo(centerX - 60, centerY - 75);
        ctx.lineTo(centerX + 60, centerY - 75);
        ctx.lineTo(centerX + 105, centerY + 75);
        ctx.lineTo(centerX - 105, centerY + 75);
        ctx.closePath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgb(59, 130, 246)';
        ctx.stroke();

        // Draw vertical dashed height line
        ctx.strokeStyle = textColor;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 75);
        ctx.lineTo(centerX, centerY + 75);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = textColor;
        const heightLabel = getDisplayValue('height');
        const aLabel = getDisplayValue('sideA');
        const bLabel = getDisplayValue('sideB');

        // Split height label: (H) on left, measurement on right
        if (heightLabel) {
          ctx.textAlign = 'right';
          ctx.fillText('(H)', centerX - 8, centerY);
          ctx.textAlign = 'left';
          ctx.fillText(heightLabel, centerX + 8, centerY);
          ctx.textAlign = 'center';
        }

        // Outside measurement labels
        if (aLabel) ctx.fillText(aLabel, centerX, centerY - 90);
        if (bLabel) ctx.fillText(bLabel, centerX, centerY + 95);

        // Inside letter labels (positioned away from center height line)
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText('A', centerX - 30, centerY - 55); // Top side (left of center)
        ctx.fillText('B', centerX - 50, centerY + 55); // Bottom side (left of center)
        ctx.font = '16px sans-serif';
        break;
      }
    }
  });

  return (
    <section class="container mx-auto p-6">
      <PageTitle text="Project Calculator" />

      {/* Shape Selector */}
      <div
        class="p-4 mt-4 rounded-lg mb-6 flex items-center gap-4"
        style="background-color: rgb(var(--color-bg-secondary)); border: 1px solid rgb(var(--color-border))"
      >
        <select
          class="flex-1"
          onChange$={(e) =>
            handleShapeChange((e.target as HTMLSelectElement).value as Shape)
          }
        >
          {Object.entries(possible_shapes).map(([key, value]) => (
            <option key={key} value={key} selected={shapeChosen.value === key}>
              {value}
            </option>
          ))}
        </select>

        {/* Info button */}
        <a href="/calculators" class="btn btn-sm btn-secondary">
          ← Back to Calculators
        </a>
      </div>

      {/* Form and Display */}
      <section class="flex flex-col lg:flex-row gap-6">
        {/* Left side: Shape canvas */}
        <div
          class="flex-1 flex justify-center items-center rounded-lg p-6"
          style="background-color: rgb(var(--color-bg-secondary)); border: 1px solid rgb(var(--color-border)); min-height: 300px;"
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            style="max-width: 100%; height: auto;"
          />
        </div>

        {/* Right side: Form */}
        <div class="flex-1">
          <form class="space-y-4" preventdefault:submit onSubmit$={calculate}>
            {shapeChosen.value !== 'null' && (
              <>
                {shapeInputs[shapeChosen.value].map((field) => {
                  // Determine label color for Annulus shape
                  let labelColor = 'rgb(var(--color-text-primary))';
                  if (shapeChosen.value === 'annulus') {
                    if (field.name === 'innerDiameter') {
                      labelColor = 'rgb(239, 68, 68)'; // Red
                    } else if (field.name === 'outerDiameter') {
                      labelColor = 'rgb(234, 179, 8)'; // Yellow
                    }
                  }

                  return (
                    <div key={field.name} class="flex gap-2">
                      <div class="flex-1">
                        <label
                          class="block mb-1 text-sm font-medium"
                          style={`color: ${labelColor}`}
                        >
                          {field.label}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={inputValues.value[field.name] || ''}
                          onInput$={(e) => {
                            const value = (e.target as HTMLInputElement).value;
                            inputValues.value = {
                              ...inputValues.value,
                              [field.name]: value,
                            };
                          }}
                          class="w-full"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      </div>
                      <div class="w-24">
                        <label
                          class="block mb-1 text-sm font-medium"
                          style="color: rgb(var(--color-text-primary))"
                        >
                          Unit
                        </label>
                        <select
                          value={
                            inputUnits.value[field.name] || field.defaultUnit
                          }
                          onChange$={(e) =>
                            handleUnitChange(
                              field.name,
                              (e.target as HTMLSelectElement).value as Metric,
                            )
                          }
                          class="w-full"
                        >
                          <option value="in">in</option>
                          <option value="ft">ft</option>
                          <option value="yd">yd</option>
                          <option value="mm">mm</option>
                          <option value="cm">cm</option>
                          <option value="m">m</option>
                        </select>
                      </div>
                    </div>
                  );
                })}

                <div>
                  <label
                    class="block mb-1 text-sm font-medium"
                    style="color: rgb(var(--color-text-primary))"
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={quantity.value}
                    onInput$={(e) => {
                      quantity.value = (e.target as HTMLInputElement).value;
                    }}
                    class="w-full"
                    placeholder="Number of areas (default: 1)"
                  />
                </div>

                <div class="flex gap-3 pt-4">
                  <button type="submit" class="btn btn-primary flex-1">
                    Calculate
                  </button>
                  <button
                    type="button"
                    onClick$={clearInputs}
                    class="btn btn-secondary"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            {shapeChosen.value === 'null' && (
              <div
                class="text-center py-8"
                style="color: rgb(var(--color-text-secondary))"
              >
                Please select a shape to begin
              </div>
            )}
          </form>

          {/* Results Display */}
          {result.value !== null && (() => {
            // Calculate buckets and round up to nearest 0.5 (half bucket)
            const exactBuckets = result.value * 2;
            const roundedBuckets = Math.ceil(exactBuckets * 2) / 2;
            const roundedYards = roundedBuckets / 2;

            return (
              <div
                class="mt-6 p-6 rounded-lg"
                style="background-color: rgb(var(--color-success) / 0.2); border: 2px solid rgb(var(--color-success))"
              >
                <h3
                  class="text-lg font-semibold mb-2"
                  style="color: rgb(var(--color-text-primary))"
                >
                  Result
                </h3>
                <p
                  class="text-3xl font-bold"
                  style="color: rgb(var(--color-success))"
                >
                  {result.value.toFixed(2)} cubic yards
                </p>
                <p
                  class="text-base mt-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  about {roundedBuckets % 1 === 0 ? roundedBuckets : roundedBuckets.toFixed(1)} buckets ({roundedYards.toFixed(2)} yds)
                </p>
                <p
                  class="text-xs mt-2 italic"
                  style="color: rgb(var(--color-text-disabled))"
                >
                  Minimum load: 1/4 yd (0.5 buckets)
                </p>
                {parseFloat(quantity.value) > 1 && (
                  <p
                    class="text-sm mt-2"
                    style="color: rgb(var(--color-text-secondary))"
                  >
                    For {quantity.value} area(s)
                  </p>
                )}
              </div>
            );
          })()}

          {/* Skid-steer Image Display */}
          <div class="flex flex-col justify-center items-center mt-6">
            <img
              src="/calculator_shapes/skidsteer.png"
              alt="Skid steer loader"
              width={350}
              height={350}
            />
          </div>
        </div>
      </section>
    </section>
  );
});
