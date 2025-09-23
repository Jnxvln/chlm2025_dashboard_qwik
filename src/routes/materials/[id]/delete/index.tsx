import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import BackButton from '~/components/BackButton';

export const useMaterialDeleteLoader = routeLoader$(async ({ params }) => {
  const id = parseInt(params.id);
  const material = await db.material.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!material) {
    throw new Error('Material not found');
  }

  return material;
});

export const useDeleteMaterialAction = routeAction$(
  async (data, { params, redirect }) => {
    const id = parseInt(params.id);

    try {
      // Soft delete by setting isActive to false
      await db.material.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      throw redirect(302, '/materials');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete material',
      };
    }
  },
);

export default component$(() => {
  const material = useMaterialDeleteLoader();
  const deleteAction = useDeleteMaterialAction();

  return (
    <div class="container mx-auto p-6 max-w-2xl">
      <div class="mb-6">
        <BackButton />
        <h1 class="text-3xl font-bold" style="color: rgb(var(--color-text-primary))">Delete Material</h1>
      </div>

      <div class="card overflow-hidden">
        {/* Material Preview */}
        <div class="md:flex">
          <div class="md:w-1/3">
            {material.value.image ? (
              <img
                src={material.value.image}
                alt={material.value.name}
                class="w-full h-48 md:h-full object-cover"
              />
            ) : (
              <div class="w-full h-48 md:h-full bg-gray-200 flex items-center justify-center">
                <svg
                  class="w-16 h-16 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          <div class="p-6 md:w-2/3">
            <div class="mb-4">
              <h2 class="text-2xl font-bold text-gray-900 mb-2">
                {material.value.name}
              </h2>
              <p class="text-blue-600 font-medium">
                {material.value.category.name}
              </p>
            </div>

            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex justify-between">
                <span class="font-medium">Stock:</span>
                <span>{material.value.stock}</span>
              </div>

              {material.value.size && (
                <div class="flex justify-between">
                  <span class="font-medium">Size:</span>
                  <span>{material.value.size}</span>
                </div>
              )}

              {material.value.bin && (
                <div class="flex justify-between">
                  <span class="font-medium">Bin:</span>
                  <span>{material.value.bin}</span>
                </div>
              )}

              <div class="flex justify-between">
                <span class="font-medium">Featured:</span>
                <span>{material.value.isFeatured ? 'Yes' : 'No'}</span>
              </div>

              <div class="flex justify-between">
                <span class="font-medium">Truckable:</span>
                <span>{material.value.isTruckable ? 'Yes' : 'No'}</span>
              </div>

              <div class="flex justify-between">
                <span class="font-medium">Created:</span>
                <span>
                  {new Date(material.value.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {material.value.description && (
              <div class="mt-4">
                <h3 class="font-medium text-gray-900 mb-1">Description:</h3>
                <p class="text-sm text-gray-600">
                  {material.value.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Section */}
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to delete this material?
            </h3>
            <p class="text-gray-600">
              This action cannot be undone. The material will be marked as
              inactive and will no longer appear in your materials list or on
              your public website.
            </p>
          </div>

          {deleteAction.value?.error && (
            <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {deleteAction.value.error}
            </div>
          )}

          <div class="flex justify-end space-x-4">
            <Link
              href="/materials"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <Form action={deleteAction}>
              <button
                type="submit"
                class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Material
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
});
