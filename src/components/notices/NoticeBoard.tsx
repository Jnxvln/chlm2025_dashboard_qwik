import { component$ } from '@builder.io/qwik';
import type { NoticeType } from '@prisma/client';

export interface Notice {
  id: number;
  content: string;
  displayDate: Date | string;
  type: NoticeType;
  urls?: Array<{
    id: number;
    displayText: string;
    url: string;
    isExternal: boolean;
  }>;
}

export interface NoticeBoardProps {
  notices: Notice[];
  sortOrder: string;
  typeFilter: string;
}

export const NoticeBoard = component$<NoticeBoardProps>(({ notices, sortOrder, typeFilter }) => {
  // Get color scheme based on notice type
  const getTypeStyles = (type: NoticeType) => {
    const styles = {
      info: {
        bg: 'rgb(100, 116, 139 / 0.1)', // slate
        border: 'rgb(100, 116, 139)',
        dot: 'rgb(100, 116, 139)',
        text: 'rgb(100, 116, 139)',
        pillDark: 'rgb(71, 85, 105)', // slate-600
        pillLight: 'rgb(100, 116, 139)', // slate-500
      },
      warning: {
        bg: 'rgb(var(--color-warning) / 0.1)',
        border: 'rgb(var(--color-warning))',
        dot: 'rgb(var(--color-warning))',
        text: 'rgb(var(--color-warning))',
        pillDark: 'rgb(161, 98, 7)', // yellow-700
        pillLight: 'rgb(202, 138, 4)', // yellow-600
      },
      danger: {
        bg: 'rgb(var(--color-danger) / 0.1)',
        border: 'rgb(var(--color-danger))',
        dot: 'rgb(var(--color-danger))',
        text: 'rgb(var(--color-danger))',
        pillDark: 'rgb(185, 28, 28)', // red-700
        pillLight: 'rgb(220, 38, 38)', // red-600
      },
      success: {
        bg: 'rgb(var(--color-success) / 0.1)',
        border: 'rgb(var(--color-success))',
        dot: 'rgb(var(--color-success))',
        text: 'rgb(var(--color-success))',
        pillDark: 'rgb(21, 128, 61)', // green-700
        pillLight: 'rgb(22, 163, 74)', // green-600
      },
    };
    return styles[type];
  };

  // Format display date with time
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const datePart = d.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} ${timePart}`;
  };

  return (
    <div class="card">
      <div
        class="card-header flex items-center justify-between"
        style="background: linear-gradient(135deg, rgb(var(--color-primary) / 0.1), rgb(var(--color-secondary) / 0.1))"
      >
        <div>
          <h2 class="text-xl font-semibold" style="color: rgb(var(--color-text-primary))">
            Notices
          </h2>
          <p class="card-subtitle">
            {typeFilter === 'all' ? 'All types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} • {sortOrder === 'newest' ? 'Newest' : 'Oldest'} first
          </p>
        </div>

        {/* Filter Controls */}
        <div class="flex gap-2">
          <select
            class="text-sm px-3 py-1 rounded"
            style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
            onChange$={(e) => {
              const newFilter = (e.target as HTMLSelectElement).value;
              localStorage.setItem('noticeType', newFilter);
              const url = new URL(window.location.href);
              url.searchParams.set('noticeType', newFilter);
              window.location.href = url.toString();
            }}
          >
            <option value="all" selected={typeFilter === 'all'}>All Types</option>
            <option value="info" selected={typeFilter === 'info'}>Info</option>
            <option value="warning" selected={typeFilter === 'warning'}>Warning</option>
            <option value="danger" selected={typeFilter === 'danger'}>Danger</option>
            <option value="success" selected={typeFilter === 'success'}>Success</option>
          </select>

          <select
            class="text-sm px-3 py-1 rounded"
            style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
            onChange$={(e) => {
              const newSort = (e.target as HTMLSelectElement).value;
              localStorage.setItem('noticeSort', newSort);
              const url = new URL(window.location.href);
              url.searchParams.set('noticeSort', newSort);
              window.location.href = url.toString();
            }}
          >
            <option value="newest" selected={sortOrder === 'newest'}>Newest First</option>
            <option value="oldest" selected={sortOrder === 'oldest'}>Oldest First</option>
          </select>
        </div>
      </div>

      {/* Notices List */}
      <div class="space-y-4">
        {notices.length > 0 ? (
          notices.map((notice) => {
            const styles = getTypeStyles(notice.type);
            return (
              <div
                key={notice.id}
                class="flex items-start space-x-3 p-4 rounded-lg border-l-4"
                style={`background-color: ${styles.bg}; border-color: ${styles.border}`}
              >
                <div
                  class="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                  style={`background-color: ${styles.dot}`}
                ></div>
                <div class="flex-1">
                  <p class="text-sm" style="color: rgb(var(--color-text-primary)); white-space: pre-wrap;">
                    <span class="font-medium" style={`color: ${styles.text}`}>
                      {formatDate(notice.displayDate)}:
                    </span>{' '}
                    {notice.content}
                  </p>

                  {/* URL Pills/Tags */}
                  {notice.urls && notice.urls.length > 0 && (
                    <div class="flex flex-wrap gap-2 mt-3">
                      {notice.urls.map((urlItem) => (
                        <a
                          key={urlItem.id}
                          href={urlItem.url}
                          target={urlItem.isExternal ? '_blank' : '_self'}
                          rel={urlItem.isExternal ? 'noopener noreferrer' : undefined}
                          class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
                          style={`background-color: ${styles.pillDark}; color: white;`}
                          title={urlItem.url}
                          onMouseEnter$={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.transform = 'translateY(-2px)';
                            target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
                            target.style.backgroundColor = `${styles.pillLight}`;
                          }}
                          onMouseLeave$={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.transform = 'translateY(0)';
                            target.style.boxShadow = 'none';
                            target.style.backgroundColor = `${styles.pillDark}`;
                          }}
                        >
                          {urlItem.isExternal ? '🔗' : '📄'} {urlItem.displayText}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div class="p-8 text-center">
            <p style="color: rgb(var(--color-text-secondary))">No notices to display</p>
          </div>
        )}
      </div>
    </div>
  );
});
