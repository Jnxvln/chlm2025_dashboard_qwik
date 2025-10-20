import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';
import BackButton from '~/components/BackButton';

export const useMaterialEditLoader = routeLoader$(async ({ params }) => {
  const id = parseInt(params.id);

  const [material, categories] = await Promise.all([
    db.material.findUnique({
      where: { id },
      include: { category: true },
    }),
    db.materialCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!material) {
    throw new Error('Material not found');
  }

  return { material, categories };
});

export const useUpdateMaterialAction = routeAction$(
  async (values, { params, redirect }) => {
    const id = parseInt(params.id);

    // Normalize capitalization before saving (description and notes are preserved)
    const normalized = normalizeFormData(values);

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
      await db.material.update({
        where: { id },
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
      return { success: false, error: 'Failed to update material' };
    }
  },
);

export default component$(() => {
  const data = useMaterialEditLoader();
  const updateAction = useUpdateMaterialAction();

  return (
    <div class="container mx-auto p-6 max-w-4xl">
      <div class="mb-6">
        <BackButton />
        <h1 class="text-3xl font-bold" style="color: rgb(var(--color-text-primary))">Edit Material</h1>
      </div>

      <div class="card">
        <Form action={updateAction}>
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
                  value={data.value.material.name}
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
                  value={data.value.material.stock}
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
                  value={data.value.material.categoryId.toString()}
                  required
                  class="w-full"
                >
                  <option value="">Select a category</option>
                  {data.value.categories.map((category) => (
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
                  value={data.value.material.size || ''}
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
                  value={data.value.material.bin || ''}
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
                  value={data.value.material.image || ''}
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
                >
                  {data.value.material.description || ''}
                </textarea>
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
                >
                  {data.value.material.notes || ''}
                </textarea>
              </div>

              {/* Checkboxes */}
              <div class="space-y-3">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={data.value.material.isFeatured}
                    class="h-4 w-4 rounded"
                    style="accent-color: rgb(var(--color-primary))"
                  />
                  <label
                    for="isFeatured"
                    class="ml-2 block text-sm font-medium"
                    style="color: rgb(var(--color-text-primary))"
                  >
                    Featured Material
                  </label>
                </div>

                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="isTruckable"
                    name="isTruckable"
                    checked={data.value.material.isTruckable}
                    class="h-4 w-4 rounded"
                    style="accent-color: rgb(var(--color-primary))"
                  />
                  <label
                    for="isTruckable"
                    class="ml-2 block text-sm font-medium"
                    style="color: rgb(var(--color-text-primary))"
                  >
                    Available for Truck Delivery
                  </label>
                </div>
              </div>
            </div>
          </div>

          {updateAction.value?.error && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
              {updateAction.value.error}
            </div>
          )}

          <div class="flex justify-end gap-3">
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
              Update Material
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
