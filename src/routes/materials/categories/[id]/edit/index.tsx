import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useCategoryLoader = routeLoader$(async ({ params }) => {
  const id = parseInt(params.id);
  const category = await db.materialCategory.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  return category;
});

export const useUpdateCategoryAction = routeAction$(
  async (data, { params, redirect }) => {
    const id = parseInt(params.id);
    const { name } = data as { name: string };

    if (!name.trim()) {
      return {
        success: false,
        error: 'Category name is required',
      };
    }

    try {
      await db.materialCategory.update({
        where: { id },
        data: {
          name: name.trim(),
          updatedAt: new Date(),
        },
      });

      throw redirect(302, '/materials/categories');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update category',
      };
    }
  },
);

export default component$(() => {
  const category = useCategoryLoader();
  const updateAction = useUpdateCategoryAction();

  return (
    <div class="container mx-auto p-6 max-w-2xl">
      <div class="mb-6">
        <Link
          href="/materials/categories"
          class="text-blue-500 hover:text-blue-700"
        >
          ← Back to Categories
        </Link>
        <h1 class="text-3xl font-bold mt-2">Edit Material Category</h1>
      </div>

      <div class="bg-white shadow-md rounded-lg p-6">
        <Form action={updateAction}>
          <div class="mb-4">
            <label
              for="name"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={category.value.name}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category name"
            />
          </div>

          {updateAction.value?.error && (
            <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {updateAction.value.error}
            </div>
          )}

          <div class="flex justify-end space-x-4">
            <Link
              href="/materials/categories"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Update Category
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
