import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import type { NoticeType } from '@prisma/client';
import { useDeleteNoticeAction } from '~/routes/notices';
import { EditIcon, DeleteIcon } from '../icons';

export interface NoticeWithUrls {
  id: number;
  content: string;
  displayDate: Date | string;
  type: NoticeType;
  createdAt: Date | string;
  urls?: Array<{
    id: number;
    displayText: string;
    url: string;
    isExternal: boolean;
  }>;
}

export interface NoticeTableProps {
  notices: NoticeWithUrls[];
}

export const NoticeTable = component$<NoticeTableProps>(({ notices }) => {
  const navigate = useNavigate();
  const deleteNoticeAction = useDeleteNoticeAction();

  // Get badge styling based on notice type
  const getTypeBadge = (type: NoticeType) => {
    const badges = {
      info: { label: 'Info', color: 'rgb(100, 116, 139)', bg: 'rgb(100, 116, 139 / 0.2)' },
      warning: { label: 'Warning', color: 'rgb(var(--color-warning))', bg: 'rgb(var(--color-warning) / 0.2)' },
      danger: { label: 'Danger', color: 'rgb(var(--color-danger))', bg: 'rgb(var(--color-danger) / 0.2)' },
      success: { label: 'Success', color: 'rgb(var(--color-success))', bg: 'rgb(var(--color-success) / 0.2)' },
    };
    const config = badges[type];
    return (
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={`background-color: ${config.bg}; color: ${config.color};`}
      >
        {config.label}
      </span>
    );
  };

  // Format date with time
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

  // Truncate content for table display
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (notices.length === 0) {
    return (
      <div class="table-container">
        <div class="p-8 text-center">
          <p style="color: rgb(var(--color-text-secondary))">No notices found</p>
        </div>
      </div>
    );
  }

  return (
    <div class="table-container overflow-x-auto">
      <table class="table-modern">
        <thead>
          <tr>
            <th>Type</th>
            <th>Display Date & Time</th>
            <th>Content</th>
            <th class="text-center">Links</th>
            <th>Created</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((notice) => (
            <tr key={notice.id}>
              <td>{getTypeBadge(notice.type)}</td>
              <td>{formatDate(notice.displayDate)}</td>
              <td>
                <div class="max-w-md" style="white-space: pre-wrap;">
                  {truncateContent(notice.content)}
                </div>
              </td>
              <td class="text-center">
                {notice.urls && notice.urls.length > 0 ? (
                  <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
                    style="background-color: rgb(var(--color-accent) / 0.2); color: rgb(var(--color-accent));"
                    title={`${notice.urls.length} link${notice.urls.length !== 1 ? 's' : ''}`}
                  >
                    {notice.urls.length}
                  </span>
                ) : (
                  <span style="color: rgb(var(--color-text-disabled))">—</span>
                )}
              </td>
              <td>{formatDate(notice.createdAt)}</td>
              <td class="text-center">
                <div class="flex justify-center items-center gap-1">
                  <button
                    class="btn-icon btn-icon-primary"
                    title="Edit notice"
                    onClick$={() => navigate(`/notices/edit/${notice.id}`)}
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    class="btn-icon btn-icon-danger"
                    title="Delete notice"
                    onClick$={async () => {
                      const confirmed = confirm(
                        'Are you sure you want to delete this notice? This will also delete all associated URLs.',
                      );
                      if (!confirmed) return;
                      await deleteNoticeAction.submit({ id: String(notice.id) });
                      window.location.reload();
                    }}
                  >
                    <DeleteIcon size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
