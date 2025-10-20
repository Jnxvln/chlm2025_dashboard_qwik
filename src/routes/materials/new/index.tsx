import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';

export const useCategoriesLoader = routeLoader$(async () => {
  const categories = await db.materialCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return categories;
});

export const useCreateMaterialAction = routeAction$(
  async (values, { redirect }) => {
    // Normalize capitalization before saving (description and notes are preserved)
    const normalized = normalizeFormData(values) as any;

    if (!normalized.name?.trim()) {
      return { success: false, error: 'Material name is required' };
    }

    if (!normalized.stock?.trim()) {
      return { success: false, error: 'Stock is required' };
    }

    if (!normalized.categoryId) {
      return { success: false, error: 'Category is required' };
    }

    try {
      await db.material.create({
        data: {
          name: normalized.name.trim(),
          stock: normalized.stock.trim(),
          image: normalized.image?.trim() || null,
          bin: normalized.bin?.trim() || null,
          size: normalized.size?.trim() || null,
          description: normalized.description?.trim() || null,
          notes: normalized.notes?.trim() || null,
          isFeatured: normalized.isFeatured === 'on',
          isTruckable: normalized.isTruckable === 'on',
          categoryId: parseInt(normalized.categoryId),
          updatedAt: new Date(),
        },
      });

      throw redirect(302, '/materials');
    } catch {
      return { success: false, error: 'Failed to create material' };
    }
  },
);

export default component$(() => {
  const categories = useCategoriesLoader();
  const createAction = useCreateMaterialAction();

  return (
    <div class="container mx-auto p-6 max-w-4xl">
      <div class="mb-6">
        <Link href="/materials" class="btn btn-ghost btn-sm">
          ← Back to Materials
        </Link>
        <h1 class="text-3xl font-bold mt-2">Add New Material</h1>
      </div>

      <div class="card">
        <Form action={createAction}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div class="space-y-4">
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Material Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  class="w-full"
                  placeholder="Enter material name"
                />
              </div>

              <div>
                <label
                  for="stock"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Stock *
                </label>
                <input
                  type="text"
                  id="stock"
                  name="stock"
                  required
                  class="w-full"
                  placeholder="e.g., In Stock, Low Stock, Out of Stock"
                />
              </div>

              <div>
                <label
                  for="categoryId"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Category *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  class="w-full"
                >
                  <option value="">Select a category</option>
                  {categories.value.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  for="size"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Size
                </label>
                <input
                  type="text"
                  id="size"
                  name="size"
                  class="w-full"
                  placeholder="e.g., 2x4, Large, Small"
                />
              </div>

              <div>
                <label
                  for="bin"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Bin Location
                </label>
                <input
                  type="text"
                  id="bin"
                  name="bin"
                  class="w-full"
                  placeholder="e.g., A1, B2, Yard-3"
                />
              </div>
            </div>

            {/* Right Column */}
            <div class="space-y-4">
              <div>
                <label
                  for="image"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Image URL
                </label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  class="w-full"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label
                  for="description"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  class="w-full"
                  placeholder="Describe the material..."
                ></textarea>
              </div>

              <div>
                <label
                  for="notes"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Internal Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  class="w-full"
                  placeholder="Internal notes (not visible to customers)..."
                ></textarea>
              </div>

              {/* Checkboxes */}
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    style="accent-color: rgb(var(--color-primary))"
                  />
                  <label
                    for="isFeatured"
                    class="text-sm font-medium"
                    style="color: rgb(var(--color-text-primary))"
                  >
                    Featured Material
                  </label>
                </div>

                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isTruckable"
                    name="isTruckable"
                    style="accent-color: rgb(var(--color-primary))"
                  />
                  <label
                    for="isTruckable"
                    class="text-sm font-medium"
                    style="color: rgb(var(--color-text-primary))"
                  >
                    Available for Truck Delivery
                  </label>
                </div>
              </div>
            </div>
          </div>

          {createAction.value?.error && (
            <div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
              {createAction.value.error}
            </div>
          )}

          <div class="flex justify-end space-x-4 mt-6">
            <Link
              href="/materials"
              class="btn btn-ghost"
            >
              Cancel
            </Link>
            <button
              type="submit"
              class="btn btn-primary"
            >
              Create Material
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
