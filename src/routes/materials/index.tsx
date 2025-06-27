import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { NavLink } from '~/components/NavLink';
import { db } from '~/lib/db';

export const useMaterialsLoader = routeLoader$(async ({ query }) => {
  const categoryId = query.get('category');
  const search = query.get('search');

  const where: any = { isActive: true };

  if (categoryId) {
    where.categoryId = parseInt(categoryId);
  }

  if (search) {
    // SQLite doesn't support mode: 'insensitive', so we'll use contains which is case-insensitive by default in SQLite
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { stock: { contains: search } },
    ];
  }

  const [materials, categories] = await Promise.all([
    db.material.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    }),
    db.materialCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    materials,
    categories,
    currentCategory: categoryId,
    currentSearch: search,
  };
});

export default component$(() => {
  const data = useMaterialsLoader();

  return (
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Materials</h1>
        <NavLink
          href="/materials/new"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add New Material
        </NavLink>
      </div>

      {/* Filters */}
      <div class="mb-6 bg-white p-4 rounded-lg shadow">
        <div class="flex flex-wrap gap-4 items-center">
          <div>
            <label
              for="category"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Filter by Category
            </label>
            <select
              id="category"
              value={data.value.currentCategory || ''}
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange$={(_, el) => {
                const url = new URL(window.location.href);
                if (el.value) {
                  url.searchParams.set('category', el.value);
                } else {
                  url.searchParams.delete('category');
                }
                window.location.href = url.toString();
              }}
            >
              <option value="">All Categories</option>
              {data.value.categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div class="flex-1 max-w-md">
            <label
              for="search"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Materials
            </label>
            <input
              type="text"
              id="search"
              value={data.value.currentSearch || ''}
              placeholder="Search by name, description, or stock..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress$={(e) => {
                if (e.key === 'Enter') {
                  const url = new URL(window.location.href);
                  const target = e.target as HTMLInputElement;
                  if (target.value) {
                    url.searchParams.set('search', target.value);
                  } else {
                    url.searchParams.delete('search');
                  }
                  window.location.href = url.toString();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {data.value.materials.length > 0 ? (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.value.materials.map((material) => (
            <div
              key={material.id}
              class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Material Image */}
              <div class="h-48 bg-gray-200 relative">
                {material.image ? (
                  <img
                    src={material.image}
                    alt={material.name}
                    class="w-full h-full object-cover"
                  />
                ) : (
                  <div class="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      class="w-16 h-16"
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

                {/* Featured Badge */}
                {material.isFeatured && (
                  <div class="absolute top-2 left-2 bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    Featured
                  </div>
                )}

                {/* Truckable Badge */}
                {material.isTruckable && (
                  <div class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Truckable
                  </div>
                )}
              </div>

              {/* Material Info */}
              <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 truncate">
                    {material.name}
                  </h3>
                  <span class="text-sm text-gray-500 ml-2">
                    {material.stock}
                  </span>
                </div>

                <p class="text-sm text-blue-600 mb-2">
                  {material.category.name}
                </p>

                {material.size && (
                  <p class="text-sm text-gray-600 mb-2">
                    Size: {material.size}
                  </p>
                )}

                {material.bin && (
                  <p class="text-sm text-gray-600 mb-2">Bin: {material.bin}</p>
                )}

                {material.description && (
                  <p class="text-sm text-gray-700 mb-3 line-clamp-2">
                    {material.description}
                  </p>
                )}

                {/* Actions */}
                <div class="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div class="flex space-x-2">
                    <NavLink
                      href={`/materials/${material.id}/edit`}
                      class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Edit
                    </NavLink>
                    <NavLink
                      href={`/materials/${material.id}/delete`}
                      class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Delete
                    </NavLink>
                  </div>
                  <span class="text-xs text-gray-500">
                    {new Date(material.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg
              class="w-24 h-24 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            No materials found
          </h3>
          <p class="text-gray-500 mb-4">
            Get started by adding your first material.
          </p>
          <NavLink
            href="/materials/new"
            class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Material
          </NavLink>
        </div>
      )}
    </div>
  );
});
