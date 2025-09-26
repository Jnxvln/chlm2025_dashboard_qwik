import { component$ } from '@builder.io/qwik';

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  class?: string;
}

export const StatusMessage = component$<StatusMessageProps>(({ type, message, title, class: className }) => {
  const typeStyles = {
    success: 'background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success)); border-color: rgb(var(--color-success) / 0.3)',
    error: 'background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger)); border-color: rgb(var(--color-danger) / 0.3)',
    warning: 'background-color: rgb(var(--color-warning) / 0.1); color: rgb(var(--color-warning)); border-color: rgb(var(--color-warning) / 0.3)',
    info: 'background-color: rgb(var(--color-info) / 0.1); color: rgb(var(--color-info)); border-color: rgb(var(--color-info) / 0.3)'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div 
      class={`p-4 rounded-lg border ${className || ''}`}
      style={typeStyles[type]}
    >
      <div class="flex items-start gap-3">
        <span class="flex-shrink-0 text-lg">
          {icons[type]}
        </span>
        <div class="flex-1">
          {title && (
            <h4 class="font-semibold mb-1">
              {title}
            </h4>
          )}
          <p class="text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
});

export default StatusMessage;