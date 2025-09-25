import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { NavLink } from '~/components/NavLink';
import { db } from '~/lib/db';
import { EditIcon, DeleteIcon } from '~/components/icons';

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
        <div></div>
        <NavLink
          href="/materials/new"
          class="btn btn-primary"
        >
          Add New Material
        </NavLink>
      </div>

      {/* Filters */}
      <div class="card mb-6">
        <div class="flex flex-wrap gap-4 items-center">
          <div>
            <label
              for="category"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Filter by Category
            </label>
            <select
              id="category"
              value={data.value.currentCategory || ''}
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
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Search Materials
            </label>
            <input
              type="text"
              id="search"
              value={data.value.currentSearch || ''}
              placeholder="Search by name, description, or stock..."
              class="w-full"
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
              class="card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Material Image */}
              <div class="h-48 relative" style="background-color: rgb(var(--color-bg-secondary))">
                {material.image ? (
                  <img
                    src={material.image}
                    alt={material.name}
                    class="w-full h-full object-cover"
                  />
                ) : (
                  <div class="w-full h-full flex items-center justify-center" style="color: rgb(var(--color-muted))">
                    <svg
                      class="w-16 h-16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                {/* Featured Badge */}
                {material.isFeatured && (
                  <div
                    class="absolute top-2 left-2 px-3 py-1 text-xs font-semibold text-white rounded-full"
                    style="background: linear-gradient(135deg, rgba(184, 134, 11, 0.9) 0%, rgba(245, 158, 11, 0.6) 50%, rgba(252, 211, 77, 0.3) 80%, rgba(252, 211, 77, 0) 100%); backdrop-filter: blur(4px);"
                  >
                    Featured
                  </div>
                )}

                {/* Truckable Badge */}
                {material.isTruckable && (
                  <div class="absolute top-2 right-2 badge badge-success">
                    Truckable
                  </div>
                )}
              </div>

              {/* Material Info */}
              <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-lg font-semibold truncate" style="color: rgb(var(--color-text-primary))">
                    {material.name}
                  </h3>
                  <span class="text-sm ml-2" style="color: rgb(var(--color-text-tertiary))">
                    {material.stock}
                  </span>
                </div>

                <p class="text-sm mb-2" style="color: rgb(var(--color-primary))">
                  {material.category.name}
                </p>

                {material.size && (
                  <p class="text-sm mb-2" style="color: rgb(var(--color-text-secondary))">
                    Size: {material.size}
                  </p>
                )}

                {material.bin && (
                  <p class="text-sm mb-2" style="color: rgb(var(--color-text-secondary))">Bin: {material.bin}</p>
                )}

                {material.description && (
                  <p class="text-sm mb-3 line-clamp-2" style="color: rgb(var(--color-text-primary))">
                    {material.description}
                  </p>
                )}

                {/* Actions */}
                <div class="flex justify-between items-center pt-3" style="border-top: 1px solid rgb(var(--color-border))">
                  <div class="flex gap-2">
                    <NavLink
                      href={`/materials/${material.id}/edit`}
                      class="btn-icon btn-icon-primary"
                      title="Edit material"
                    >
                      <EditIcon />
                    </NavLink>
                    <NavLink
                      href={`/materials/${material.id}/delete`}
                      class="btn-icon btn-icon-danger"
                      title="Delete material"
                    >
                      <DeleteIcon />
                    </NavLink>
                  </div>
                  <span class="text-xs" style="color: rgb(var(--color-text-tertiary))">
                    {new Date(material.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div class="card text-center py-12">
          <div class="mb-4" style="color: rgb(var(--color-muted))">
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
          <h3 class="text-lg font-medium mb-2" style="color: rgb(var(--color-text-primary))">
            No materials found
          </h3>
          <p class="mb-4" style="color: rgb(var(--color-text-secondary))">
            Get started by adding your first material.
          </p>
          <NavLink
            href="/materials/new"
            class="btn btn-primary"
          >
            Add Material
          </NavLink>
        </div>
      )}
    </div>
  );
});
