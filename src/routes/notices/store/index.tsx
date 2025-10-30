import { component$, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  type DocumentHead,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { StoreNoticeTable } from '~/components/notices/StoreNoticeTable';
import PageTitle from '~/components/PageTitle';
import { AddIcon } from '~/components/icons';
import BackButton from '~/components/BackButton';

export const useStoreNoticesLoader = routeLoader$(async ({ query }) => {
  const sortOrder = query.get('storeNoticeSort') || 'newest';
  const typeFilter = query.get('storeNoticeType') || 'all';
  const statusFilter = query.get('storeNoticeStatus') || 'all';

  const order = sortOrder === 'newest' ? 'desc' : 'asc';

  const where: any = {};
  if (typeFilter !== 'all') {
    where.type = typeFilter;
  }
  if (statusFilter === 'active') {
    where.isActive = true;
  } else if (statusFilter === 'inactive') {
    where.isActive = false;
  }

  const notices = await db.storeNotice.findMany({
    where,
    orderBy: {
      displayUntil: order,
    },
  });

  return {
    notices,
    sortOrder,
    typeFilter,
    statusFilter,
  };
});

export const useDeleteStoreNoticeAction = routeAction$(async (data, { fail }) => {
  const id = Number(data.id);

  if (isNaN(id)) {
    return fail(400, { error: 'Invalid store notice ID' });
  }

  try {
    await db.storeNotice.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to delete store notice:', error);
    return fail(500, { error: 'Failed to delete store notice' });
  }
});

export default component$(() => {
  const data = useStoreNoticesLoader();

  // Load saved store notice preferences from localStorage on mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    const hasStoreNoticeParams = url.searchParams.has('storeNoticeSort') || url.searchParams.has('storeNoticeType') || url.searchParams.has('storeNoticeStatus');

    // If URL has params, save them to localStorage
    if (hasStoreNoticeParams) {
      const storeNoticeSort = url.searchParams.get('storeNoticeSort') || 'newest';
      const storeNoticeType = url.searchParams.get('storeNoticeType') || 'all';
      const storeNoticeStatus = url.searchParams.get('storeNoticeStatus') || 'all';
      localStorage.setItem('storeNoticeSort', storeNoticeSort);
      localStorage.setItem('storeNoticeType', storeNoticeType);
      localStorage.setItem('storeNoticeStatus', storeNoticeStatus);
    } else {
      // If no URL params, check localStorage and redirect if preferences exist
      const savedSort = localStorage.getItem('storeNoticeSort');
      const savedType = localStorage.getItem('storeNoticeType');
      const savedStatus = localStorage.getItem('storeNoticeStatus');

      if (savedSort || savedType || savedStatus) {
        if (savedSort) url.searchParams.set('storeNoticeSort', savedSort);
        if (savedType) url.searchParams.set('storeNoticeType', savedType);
        if (savedStatus) url.searchParams.set('storeNoticeStatus', savedStatus);
        window.location.href = url.toString();
      }
    }
  });

  return (
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <BackButton />
      </div>

      <div class="mb-6 flex items-center justify-between">
        <div>
          <PageTitle text="Store Notices" />
          <p class="text-sm mt-2" style="color: rgb(var(--color-text-secondary))">
            Manage notices for the public store website homepage
          </p>
        </div>
        <a href="/notices/store/new" class="btn btn-primary flex items-center gap-2">
          <AddIcon size={16} />
          New Store Notice
        </a>
      </div>

      {/* Filter Controls */}
      <div class="card mb-6">
        <div class="card-header">
          <h3
            class="text-lg font-semibold"
            style="color: rgb(var(--color-text-primary))"
          >
            Filters
          </h3>
        </div>
        <div class="flex flex-wrap gap-4">
          <div>
            <label
              for="typeFilter"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Notice Type
            </label>
            <select
              id="typeFilter"
              class="px-3 py-2 rounded"
              style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
              onChange$={(e) => {
                const newFilter = (e.target as HTMLSelectElement).value;
                localStorage.setItem('storeNoticeType', newFilter);
                const url = new URL(window.location.href);
                url.searchParams.set('storeNoticeType', newFilter);
                window.location.href = url.toString();
              }}
            >
              <option value="all" selected={data.value.typeFilter === 'all'}>
                All Types
              </option>
              <option value="info" selected={data.value.typeFilter === 'info'}>
                Info
              </option>
              <option
                value="warning"
                selected={data.value.typeFilter === 'warning'}
              >
                Warning
              </option>
              <option
                value="danger"
                selected={data.value.typeFilter === 'danger'}
              >
                Danger
              </option>
              <option
                value="success"
                selected={data.value.typeFilter === 'success'}
              >
                Success
              </option>
            </select>
          </div>

          <div>
            <label
              for="statusFilter"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Status
            </label>
            <select
              id="statusFilter"
              class="px-3 py-2 rounded"
              style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
              onChange$={(e) => {
                const newFilter = (e.target as HTMLSelectElement).value;
                localStorage.setItem('storeNoticeStatus', newFilter);
                const url = new URL(window.location.href);
                url.searchParams.set('storeNoticeStatus', newFilter);
                window.location.href = url.toString();
              }}
            >
              <option value="all" selected={data.value.statusFilter === 'all'}>
                All Statuses
              </option>
              <option value="active" selected={data.value.statusFilter === 'active'}>
                Active Only
              </option>
              <option value="inactive" selected={data.value.statusFilter === 'inactive'}>
                Inactive Only
              </option>
            </select>
          </div>

          <div>
            <label
              for="sortOrder"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Sort Order
            </label>
            <select
              id="sortOrder"
              class="px-3 py-2 rounded"
              style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
              onChange$={(e) => {
                const newSort = (e.target as HTMLSelectElement).value;
                localStorage.setItem('storeNoticeSort', newSort);
                const url = new URL(window.location.href);
                url.searchParams.set('storeNoticeSort', newSort);
                window.location.href = url.toString();
              }}
            >
              <option
                value="newest"
                selected={data.value.sortOrder === 'newest'}
              >
                Newest First
              </option>
              <option
                value="oldest"
                selected={data.value.sortOrder === 'oldest'}
              >
                Oldest First
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Store Notices Table */}
      <div class="card">
        <div class="card-header">
          <h3
            class="text-lg font-semibold"
            style="color: rgb(var(--color-text-primary))"
          >
            All Store Notices ({data.value.notices.length})
          </h3>
        </div>
        <StoreNoticeTable notices={data.value.notices} />
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Store Notices | CHLM Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Manage store notices for the public website',
    },
  ],
};
