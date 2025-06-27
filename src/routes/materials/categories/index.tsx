import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

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
        <h1 class="text-3xl font-bold">Material Categories</h1>
        <Link
          href="/materials/categories/new"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add New Category
        </Link>
      </div>

      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Materials Count
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {categories.value.map((category) => (
              <tr key={category.id} class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {category.name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category._count.materials}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(category.createdAt).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link
                    href={`/materials/categories/${category.id}/edit`}
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/materials/categories/${category.id}/delete`}
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.value.length === 0 && (
          <div class="text-center py-12">
            <p class="text-gray-500">No material categories found.</p>
            <Link
              href="/materials/categories/new"
              class="mt-4 inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Create your first category
            </Link>
          </div>
        )}
      </div>
    </div>
  );
});
