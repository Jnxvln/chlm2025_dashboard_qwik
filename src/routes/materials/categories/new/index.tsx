import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import BackButton from '~/components/BackButton';

export const useCreateCategoryAction = routeAction$(
  async (data, { redirect }) => {
    const { name } = data as { name: string };

    if (!name.trim()) {
      return {
        success: false,
        error: 'Category name is required',
      };
    }

    try {
      await db.materialCategory.create({
        data: {
          name: name.trim(),
          updatedAt: new Date(),
        },
      });

      throw redirect(302, '/materials/categories');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create category',
      };
    }
  },
);

export default component$(() => {
  const createAction = useCreateCategoryAction();

  return (
    <div class="container mx-auto p-6 max-w-2xl">
      <div class="mb-6">
        <BackButton />
        <h1 class="text-3xl font-bold" style="color: rgb(var(--color-text-primary))">Add New Material Category</h1>
      </div>

      <div class="card">
        <Form action={createAction} class="space-y-6">
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
              required
              class="w-full"
              placeholder="Enter category name"
            />
          </div>

          {createAction.value?.error && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
              {createAction.value.error}
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
              Create Category
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
