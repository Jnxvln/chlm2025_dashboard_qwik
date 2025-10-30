import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import type { NoticeType } from '@prisma/client';
import { useDeleteStoreNoticeAction } from '~/routes/notices/store';
import { EditIcon, DeleteIcon } from '../icons';

export interface StoreNotice {
  id: number;
  title: string;
  content: string;
  type: NoticeType;
  createdAt: Date | string;
  displayUntil: Date | string;
  showCreatedAt: boolean;
  isActive: boolean;
}

export interface StoreNoticeTableProps {
  notices: StoreNotice[];
}

export const StoreNoticeTable = component$<StoreNoticeTableProps>(({ notices }) => {
  const navigate = useNavigate();
  const deleteStoreNoticeAction = useDeleteStoreNoticeAction();

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
          <p style="color: rgb(var(--color-text-secondary))">No store notices found</p>
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
            <th>Title</th>
            <th>Content</th>
            <th>Display Until</th>
            <th>Active</th>
            <th>Created</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((notice) => (
            <tr key={notice.id}>
              <td>{getTypeBadge(notice.type)}</td>
              <td>
                <div class="font-medium" style="color: rgb(var(--color-text-primary))">
                  {notice.title}
                </div>
              </td>
              <td>
                <div class="max-w-md" style="white-space: pre-wrap;">
                  {truncateContent(notice.content)}
                </div>
              </td>
              <td>{formatDate(notice.displayUntil)}</td>
              <td>
                {notice.isActive ? (
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style="background-color: rgb(var(--color-success) / 0.2); color: rgb(var(--color-success));"
                  >
                    Active
                  </span>
                ) : (
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style="background-color: rgb(100, 116, 139 / 0.2); color: rgb(100, 116, 139);"
                  >
                    Inactive
                  </span>
                )}
              </td>
              <td>{formatDate(notice.createdAt)}</td>
              <td class="text-center">
                <div class="flex justify-center items-center gap-1">
                  <button
                    class="btn-icon btn-icon-primary"
                    title="Edit store notice"
                    onClick$={() => navigate(`/notices/store/edit/${notice.id}`)}
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    class="btn-icon btn-icon-danger"
                    title="Delete store notice"
                    onClick$={async () => {
                      const confirmed = confirm(
                        'Are you sure you want to delete this store notice?',
                      );
                      if (!confirmed) return;
                      await deleteStoreNoticeAction.submit({ id: String(notice.id) });
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
