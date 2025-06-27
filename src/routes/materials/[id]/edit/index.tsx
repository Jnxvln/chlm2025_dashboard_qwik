import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

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
  async (data, { params, redirect }) => {
    const id = parseInt(params.id);
    const formData = data as any;

    if (!formData.name?.trim()) {
      return { success: false, error: 'Material name is required' };
    }

    if (!formData.stock?.trim()) {
      return { success: false, error: 'Stock is required' };
    }

    if (!formData.categoryId) {
      return { success: false, error: 'Category is required' };
    }

    try {
      await db.material.update({
        where: { id },
        data: {
          name: formData.name.trim(),
          stock: formData.stock.trim(),
          image: formData.image?.trim() || null,
          bin: formData.bin?.trim() || null,
          size: formData.size?.trim() || null,
          description: formData.description?.trim() || null,
          notes: formData.notes?.trim() || null,
          isFeatured: formData.isFeatured === 'on',
          isTruckable: formData.isTruckable === 'on',
          categoryId: parseInt(formData.categoryId),
          updatedAt: new Date(),
        },
      });

      throw redirect(302, '/materials');
    } catch (error) {
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
        <Link href="/materials" class="text-blue-500 hover:text-blue-700">
          ← Back to Materials
        </Link>
        <h1 class="text-3xl font-bold mt-2">Edit Material</h1>
      </div>

      <div class="bg-white shadow-md rounded-lg p-6">
        <Form action={updateAction}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div class="space-y-4">
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Material Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={data.value.material.name}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter material name"
                />
              </div>

              <div>
                <label
                  for="stock"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Stock *
                </label>
                <input
                  type="text"
                  id="stock"
                  name="stock"
                  value={data.value.material.stock}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., In Stock, Low Stock, Out of Stock"
                />
              </div>

              <div>
                <label
                  for="categoryId"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={data.value.material.categoryId.toString()}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Size
                </label>
                <input
                  type="text"
                  id="size"
                  name="size"
                  value={data.value.material.size || ''}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2x4, Large, Small"
                />
              </div>

              <div>
                <label
                  for="bin"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Bin Location
                </label>
                <input
                  type="text"
                  id="bin"
                  name="bin"
                  value={data.value.material.bin || ''}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., A1, B2, Yard-3"
                />
              </div>
            </div>

            {/* Right Column */}
            <div class="space-y-4">
              <div>
                <label
                  for="image"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Image URL
                </label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={data.value.material.image || ''}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label
                  for="description"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the material..."
                >
                  {data.value.material.description || ''}
                </textarea>
              </div>

              <div>
                <label
                  for="notes"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Internal Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    for="isFeatured"
                    class="ml-2 block text-sm text-gray-700"
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
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    for="isTruckable"
                    class="ml-2 block text-sm text-gray-700"
                  >
                    Available for Truck Delivery
                  </label>
                </div>
              </div>
            </div>
          </div>

          {updateAction.value?.error && (
            <div class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {updateAction.value.error}
            </div>
          )}

          <div class="flex justify-end space-x-4 mt-6">
            <Link
              href="/materials"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Update Material
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
