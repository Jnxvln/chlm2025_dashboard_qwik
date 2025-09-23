import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { EditIcon, DeleteIcon } from '~/components/icons';
import { NavLink } from '~/components/NavLink';

export const useMaterialCategoriesLoader = routeLoader$(async () => {
  const categories = await db.materialCategory.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { materials: true },
      },
    },
    orderBy: { name: 'asc' },
  });
  return categories;
});

export default component$(() => {
  const categories = useMaterialCategoriesLoader();

  return (
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold" style="color: rgb(var(--color-text-primary))">Material Categories</h1>
        <NavLink
          href="/materials/categories/new"
          class="btn btn-primary"
        >
          + Add New Category
        </NavLink>
      </div>

      <div class="flex gap-4 mb-6">
        <NavLink
          href="/materials"
          class="btn btn-ghost"
        >
          ← Materials
        </NavLink>
      </div>

      <div class="table-container overflow-x-auto">
        <table class="table-modern">
          <thead>
            <tr>
              <th class="text-left">
                Name
              </th>
              <th class="text-left">
                Materials Count
              </th>
              <th class="text-left">
                Created
              </th>
              <th class="text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.value.map((category) => (
              <tr key={category.id}>
                <td class="whitespace-nowrap font-medium">
                  {category.name}
                </td>
                <td class="whitespace-nowrap">
                  <span class="badge badge-secondary">
                    {category._count.materials} materials
                  </span>
                </td>
                <td class="whitespace-nowrap" style="color: rgb(var(--color-text-secondary))">
                  {new Date(category.createdAt).toLocaleDateString()}
                </td>
                <td class="text-center">
                  <div class="flex justify-center items-center gap-2">
                    <NavLink
                      href={`/materials/categories/${category.id}/edit`}
                      class="btn-icon btn-icon-primary"
                      title="Edit category"
                    >
                      <EditIcon />
                    </NavLink>
                    <NavLink
                      href={`/materials/categories/${category.id}/delete`}
                      class="btn-icon btn-icon-danger"
                      title="Delete category"
                    >
                      <DeleteIcon />
                    </NavLink>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categories.value.length === 0 && (
        <div class="card text-center py-12">
          <p class="mb-4" style="color: rgb(var(--color-text-secondary))">No material categories found.</p>
          <NavLink
            href="/materials/categories/new"
            class="btn btn-primary"
          >
            Create your first category
          </NavLink>
        </div>
      )}
    </div>
  );
});
