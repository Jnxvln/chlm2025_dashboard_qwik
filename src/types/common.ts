/**
 * Common type definitions shared across the application
 */

/**
 * Generic table column configuration for ModernTable component
 */
export interface TableColumn<T = any> {
  /** Column header text */
  header: string;
  /** Property key to access in data object */
  key: keyof T | string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: any, row: T) => string | number;
  /** CSS class names for the column */
  className?: string;
}

/**
 * Generic select option for dropdown components
 */
export interface SelectOption {
  /** Display label for the option */
  label: string;
  /** Value stored when selected */
  value: string | number;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Optional group/category for grouping options */
  group?: string;
}

/**
 * Pagination state for tables and lists
 */
export interface PaginationState {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items across all pages */
  totalItems: number;
}

/**
 * Sort state for table columns
 */
export interface SortState {
  /** Column key being sorted */
  column: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Filter state for searchable/filterable lists
 */
export interface FilterState {
  /** Search query string */
  query?: string;
  /** Additional filters as key-value pairs */
  filters?: Record<string, any>;
}

/**
 * Action result from routeAction$ functions
 */
export interface ActionResult<T = any> {
  /** Whether the action succeeded */
  success: boolean;
  /** Error message if action failed */
  error?: string;
  /** Data returned from successful action */
  data?: T;
}
