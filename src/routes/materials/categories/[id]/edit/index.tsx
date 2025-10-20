import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';
import BackButton from '~/components/BackButton';

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
  async (values, { params, redirect }) => {
    const id = parseInt(params.id);

    // Normalize capitalization before saving
    const normalized = normalizeFormData(values);
    const { name } = normalized as { name: string };

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
    } catch {
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
        <BackButton />
        <h1 class="text-3xl font-bold" style="color: rgb(var(--color-text-primary))">Edit Material Category</h1>
      </div>

      <div class="card">
        <Form action={updateAction}>
          <div class="space-y-6">
            <div>
              <label
                for="name"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={category.value.name}
                required
                class="w-full"
                placeholder="Enter category name"
              />
            </div>
          </div>

          {updateAction.value?.error && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
              {updateAction.value.error}
            </div>
          )}

          <div class="flex justify-end gap-3">
            <Link
              href="/materials/categories"
              class="btn btn-ghost"
            >
              Cancel
            </Link>
            <button
              type="submit"
              class="btn btn-primary"
            >
              Update Category
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
