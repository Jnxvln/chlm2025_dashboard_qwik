import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, zod$, z, useNavigate } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { EditIcon, DeleteIcon } from '~/components/icons';
import { NavLink } from '~/components/NavLink';

export const useMaterialCategoriesLoader = routeLoader$(async () => {
  const categories = await db.materialCategory.findMany({
    include: {
      _count: {
        select: { materials: true },
      },
    },
    orderBy: { name: 'asc' },
  });
  return categories;
});

export const useDeactivateMaterialCategoryAction = routeAction$(
  async ({ id }, _requestEvent) => {
    try {
      const categoryId = Number(id);

      // Get all currently active materials in this category
      const activeMaterials = await db.material.findMany({
        where: { categoryId, isActive: true },
        select: { id: true },
      });

      // Cascade deactivate: mark category and all currently active materials as inactive
      await Promise.all([
        // Deactivate category
        db.materialCategory.update({
          where: { id: categoryId },
          data: { isActive: false },
        }),
        // Deactivate active materials and mark as deactivatedByParent
        db.material.updateMany({
          where: { id: { in: activeMaterials.map((m) => m.id) } },
          data: { isActive: false, deactivatedByParent: true },
        }),
      ]);

      return { success: true };
    } catch (error) {
      console.error('Deactivate failed:', error);
      return { success: false, error: 'Failed to deactivate material category' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export const useReactivateMaterialCategoryAction = routeAction$(
  async ({ id }, _requestEvent) => {
    try {
      const categoryId = Number(id);

      // Get all materials that were deactivated by parent
      const parentDeactivatedMaterials = await db.material.findMany({
        where: { categoryId, deactivatedByParent: true },
        select: { id: true },
      });

      // Reactivate category and restore materials that were auto-deactivated
      await Promise.all([
        // Reactivate category
        db.materialCategory.update({
          where: { id: categoryId },
          data: { isActive: true },
        }),
        // Reactivate materials that were deactivatedByParent
        db.material.updateMany({
          where: { id: { in: parentDeactivatedMaterials.map((m) => m.id) } },
          data: { isActive: true, deactivatedByParent: false },
        }),
      ]);

      return { success: true };
    } catch (error) {
      console.error('Reactivate failed:', error);
      return { success: false, error: 'Failed to reactivate material category' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const categories = useMaterialCategoriesLoader();
  const nav = useNavigate();
  const deactivateAction = useDeactivateMaterialCategoryAction();
  const reactivateAction = useReactivateMaterialCategoryAction();

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
              <tr key={category.id} class={!category.isActive ? 'row-inactive' : ''}>
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
                  <div class="flex justify-center items-center gap-1">
                    <button
                      class="btn-icon btn-icon-primary"
                      title="Edit category"
                      onClick$={() => nav(`/materials/categories/${category.id}/edit`)}
                    >
                      <EditIcon size={16} />
                    </button>
                    {category.isActive ? (
                      <button
                        class="btn-icon btn-icon-danger"
                        title="Deactivate category"
                        onClick$={async () => {
                          const confirmed = confirm(
                            'Are you sure you want to remove this material category? This will mark it as inactive.',
                          );
                          if (!confirmed) return;
                          await deactivateAction.submit({
                            id: String(category.id),
                          });
                          window.location.reload();
                        }}
                      >
                        <DeleteIcon size={16} />
                      </button>
                    ) : (
                      <button
                        class="btn-icon btn-icon-success"
                        title="Reactivate category"
                        onClick$={async () => {
                          await reactivateAction.submit({
                            id: String(category.id),
                          });
                          window.location.reload();
                        }}
                      >
                        <svg
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M3 21v-5h5" />
                        </svg>
                      </button>
                    )}
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
