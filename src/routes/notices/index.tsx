import { component$, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  type DocumentHead,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { NoticeTable } from '~/components/notices/NoticeTable';
import PageTitle from '~/components/PageTitle';
import PageSubtitle from '~/components/PageSubtitle';
import { AddIcon } from '~/components/icons';

export const useNoticesLoader = routeLoader$(async ({ query }) => {
  const sortOrder = query.get('noticeSort') || 'newest';
  const typeFilter = query.get('noticeType') || 'all';

  const order = sortOrder === 'newest' ? 'desc' : 'asc';

  const where: any = {};
  if (typeFilter !== 'all') {
    where.type = typeFilter;
  }

  const notices = await db.notice.findMany({
    where,
    include: {
      urls: true,
    },
    orderBy: {
      displayDate: order,
    },
  });

  return {
    notices,
    sortOrder,
    typeFilter,
  };
});

export const useDeleteNoticeAction = routeAction$(async (data, { fail }) => {
  const id = Number(data.id);

  if (isNaN(id)) {
    return fail(400, { error: 'Invalid notice ID' });
  }

  try {
    // Delete the notice (cascade will delete associated URLs)
    await db.notice.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to delete notice:', error);
    return fail(500, { error: 'Failed to delete notice' });
  }
});

export default component$(() => {
  const data = useNoticesLoader();

  // Load saved notice preferences from localStorage on mount
  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    const hasNoticeParams = url.searchParams.has('noticeSort') || url.searchParams.has('noticeType');

    // If URL has params, save them to localStorage
    if (hasNoticeParams) {
      const noticeSort = url.searchParams.get('noticeSort') || 'newest';
      const noticeType = url.searchParams.get('noticeType') || 'all';
      localStorage.setItem('noticeSort', noticeSort);
      localStorage.setItem('noticeType', noticeType);
    } else {
      // If no URL params, check localStorage and redirect if preferences exist
      const savedSort = localStorage.getItem('noticeSort');
      const savedType = localStorage.getItem('noticeType');

      if (savedSort || savedType) {
        if (savedSort) url.searchParams.set('noticeSort', savedSort);
        if (savedType) url.searchParams.set('noticeType', savedType);
        window.location.href = url.toString();
      }
    }
  });

  return (
    <div class="container mx-auto p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <PageTitle text="Notice Board" />
        </div>
        <a href="/notices/new" class="btn btn-primary flex items-center gap-2">
          <AddIcon size={16} />
          New Notice
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
                localStorage.setItem('noticeType', newFilter);
                const url = new URL(window.location.href);
                url.searchParams.set('noticeType', newFilter);
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
                localStorage.setItem('noticeSort', newSort);
                const url = new URL(window.location.href);
                url.searchParams.set('noticeSort', newSort);
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

      {/* Notices Table */}
      <div class="card">
        <div class="card-header">
          <h3
            class="text-lg font-semibold"
            style="color: rgb(var(--color-text-primary))"
          >
            All Notices ({data.value.notices.length})
          </h3>
        </div>
        <NoticeTable notices={data.value.notices} />
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Notice Board | CHLM Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Manage notices for the CHLM dashboard',
    },
  ],
};
