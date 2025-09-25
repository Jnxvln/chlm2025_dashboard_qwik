import { component$, $, QRL } from '@builder.io/qwik';
import { EditIcon, DeleteIcon, ViewIcon, MoreIcon } from './icons';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableAction {
  type: 'edit' | 'delete' | 'view' | 'custom';
  label: string;
  href?: string;
  icon?: any;
  variant?: 'primary' | 'danger' | 'secondary';
  confirmMessage?: string;
}

export interface ModernTableProps {
  columns: TableColumn[];
  data: any[];
  actions?: TableAction[];
  onAction?: QRL<(actionType: string, item: any) => void>;
  highlightId?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export const ModernTable = component$<ModernTableProps>(({
  columns,
  data,
  actions = [],
  onAction,
  highlightId,
  emptyMessage = 'No data available',
  loading = false
}) => {
  // Create a serializable action handler
  const handleAction = $((actionType: string, item: any, confirmMessage?: string) => {
    if (confirmMessage) {
      const confirmed = confirm(confirmMessage);
      if (!confirmed) return;
    }
    onAction?.(actionType, item);
  });
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'edit':
        return EditIcon;
      case 'delete':
        return DeleteIcon;
      case 'view':
        return ViewIcon;
      default:
        return MoreIcon;
    }
  };

  const getActionClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'btn-icon btn-icon-primary';
      case 'danger':
        return 'btn-icon btn-icon-danger';
      default:
        return 'btn-icon';
    }
  };

  if (loading) {
    return (
      <div class="table-container">
        <div class="p-8 text-center">
          <div class="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" role="status">
            <span class="sr-only">Loading...</span>
          </div>
          <p class="mt-2 text-sm" style="color: rgb(var(--color-text-secondary))">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div class="table-container">
        <div class="p-8 text-center">
          <p style="color: rgb(var(--color-text-secondary))">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div class="table-container overflow-x-auto">
      <table class="table-modern">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={column.width ? `width: ${column.width}` : undefined}
                class={column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}
              >
                {column.label}
              </th>
            ))}
            {actions.length > 0 && (
              <th class="text-center">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const isHighlighted = highlightId && String(item.id) === highlightId;
            return (
              <tr
                key={item.id || index}
                class={isHighlighted ? 'row-highlighted' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    class={column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}
                  >
                    {item[column.key] || '—'}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td class="text-center">
                    <div class="flex justify-center items-center gap-1">
                      {actions.map((action, actionIndex) => {
                        const IconComponent = action.icon || getActionIcon(action.type);
                        return (
                          <button
                            key={actionIndex}
                            class={getActionClass(action.variant)}
                            title={action.label}
                            onClick$={() => handleAction(action.type, item, action.confirmMessage)}
                          >
                            <IconComponent size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export const StatusBadge = component$(({
  status,
  variant = 'secondary'
}: {
  status: string;
  variant?: 'success' | 'danger' | 'warning' | 'secondary';
}) => (
  <span class={`badge badge-${variant}`}>
    {status}
  </span>
));

export const CurrencyCell = component$(({ value }: { value: number }) => (
  <span class="font-medium">
    ${value.toFixed(2)}
  </span>
));

export const DateCell = component$(({ date }: { date: string | Date | null }) => (
  <span>
    {date ? new Date(date).toLocaleDateString() : '—'}
  </span>
));

export const NameCell = component$(({ firstName, lastName }: { firstName: string; lastName?: string }) => (
  <span class="font-medium">
    {firstName} {lastName || ''}
  </span>
));