import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useCategoryDeleteLoader = routeLoader$(async ({ params }) => {
  const id = parseInt(params.id);
  const category = await db.materialCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: { materials: true },
      },
    },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  return category;
});

export const useDeleteCategoryAction = routeAction$(
  async (data, { params, redirect }) => {
    const id = parseInt(params.id);

    try {
      // Check if category has materials
      const materialCount = await db.material.count({
        where: { categoryId: id, isActive: true },
      });

      if (materialCount > 0) {
        return {
          success: false,
          error: `Cannot delete category. It has ${materialCount} active materials.`,
        };
      }

      // Soft delete by setting isActive to false
      await db.materialCategory.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      throw redirect(302, '/materials/categories');
    } catch {
      return {
        success: false,
        error: 'Failed to delete category',
      };
    }
  },
);

export default component$(() => {
  const category = useCategoryDeleteLoader();
  const deleteAction = useDeleteCategoryAction();

  return (
    <div class="container mx-auto p-6 max-w-2xl">
      <div class="mb-6">
        <Link
          href="/materials/categories"
          class="text-blue-500 hover:text-blue-700"
        >
          ← Back to Categories
        </Link>
        <h1 class="text-3xl font-bold mt-2">Delete Material Category</h1>
      </div>

      <div class="bg-white shadow-md rounded-lg p-6">
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-2">
            Are you sure you want to delete "{category.value.name}"?
          </h2>

          {category.value._count.materials > 0 ? (
            <div class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mb-4">
              <p class="font-medium">Warning:</p>
              <p>
                This category has {category.value._count.materials} materials
                associated with it. You cannot delete a category that has active
                materials.
              </p>
            </div>
          ) : (
            <p class="text-gray-600 mb-4">
              This action cannot be undone. The category will be marked as
              inactive.
            </p>
          )}
        </div>

        {deleteAction.value?.error && (
          <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {deleteAction.value.error}
          </div>
        )}

        <div class="flex justify-end space-x-4">
          <Link
            href="/materials/categories"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          {category.value._count.materials === 0 && (
            <Form action={deleteAction}>
              <button
                type="submit"
                class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Category
              </button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
});
