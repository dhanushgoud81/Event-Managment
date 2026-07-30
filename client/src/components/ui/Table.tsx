import React from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ChevronUp, ChevronDown } from 'lucide-react';

// ─── Table Root ──────────────────────────────

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table: React.FC<TableProps> = ({ className, children, ...props }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
    <table className={clsx('w-full text-sm', className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <thead className={clsx('bg-surface-50 dark:bg-surface-800/50', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <tbody className={clsx('divide-y divide-surface-200 dark:divide-surface-700', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...props
}) => (
  <tr
    className={clsx(
      'transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/30',
      className
    )}
    {...props}
  >
    {children}
  </tr>
);

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export const TableHead: React.FC<TableHeadProps> = ({
  className,
  children,
  sortable,
  sorted,
  onSort,
  ...props
}) => {
  const content = (
    <>
      {children}
      {sortable && (
        <span className="flex flex-col ml-1">
          <ChevronUp className={clsx('w-3 h-3 -mb-1', sorted === 'asc' ? 'text-primary-500' : 'text-surface-300')} />
          <ChevronDown className={clsx('w-3 h-3', sorted === 'desc' ? 'text-primary-500' : 'text-surface-300')} />
        </span>
      )}
    </>
  );

  return (
    <th
      className={clsx(
        'px-4 py-3 text-left text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className="flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
        >
          {content}
        </button>
      ) : (
        <div className="flex items-center gap-1">
          {content}
        </div>
      )}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <td
    className={clsx('px-4 py-3 text-surface-700 dark:text-surface-300', className)}
    {...props}
  >
    {children}
  </td>
);

// ─── Search Bar ──────────────────────────────

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TableSearch: React.FC<TableSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input pl-10 max-w-xs"
    />
  </div>
);

// ─── Pagination ──────────────────────────────

interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}) => {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-700">
      <p className="text-sm text-surface-500">
        Showing <span className="font-medium text-surface-700 dark:text-surface-300">{start}</span> to{' '}
        <span className="font-medium text-surface-700 dark:text-surface-300">{end}</span> of{' '}
        <span className="font-medium text-surface-700 dark:text-surface-300">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <PaginationButton onClick={() => onPageChange(1)} disabled={page === 1}>
          <ChevronsLeft className="w-4 h-4" />
        </PaginationButton>
        <PaginationButton onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft className="w-4 h-4" />
        </PaginationButton>

        <span className="px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
          {page} / {totalPages}
        </span>

        <PaginationButton onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          <ChevronRight className="w-4 h-4" />
        </PaginationButton>
        <PaginationButton onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
          <ChevronsRight className="w-4 h-4" />
        </PaginationButton>
      </div>
    </div>
  );
};

const PaginationButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...props
}) => (
  <button
    className={clsx(
      'p-1.5 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

// ─── Empty State ─────────────────────────────

interface TableEmptyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  colSpan?: number;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  icon,
  title = 'No data found',
  description = 'There are no records to display.',
  action,
  colSpan = 1,
}) => (
  <tr>
    <td colSpan={colSpan}>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {icon && <div className="text-surface-300 dark:text-surface-600 mb-3">{icon}</div>}
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">{title}</h3>
        <p className="text-sm text-surface-500 mt-1 max-w-sm">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </td>
  </tr>
);
