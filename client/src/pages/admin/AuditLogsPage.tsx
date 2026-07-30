import React from 'react';
import { useAuditLogs } from '@/hooks/useDashboard';
import { PageLoader } from '@/components/ui/Spinner';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  TableSearch,
  TablePagination,
} from '@/components/ui/Table';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export const AuditLogsPage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  const { data, isLoading, refetch } = useAuditLogs({
    page,
    limit,
    search,
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Security Audit Logs</h1>
          <p className="text-sm text-surface-500">Track administrators operations, permissions updates, and scan checks.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg text-surface-500"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table controls */}
      <div className="flex items-center justify-between">
        <TableSearch value={search} onChange={(val) => { setSearch(val); setPage(1); }} />
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <PageLoader message="Loading security history..." />
      ) : (
        <div className="bg-white dark:bg-surface-800 border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Operation Action</TableHead>
                <TableHead>Entity Impacted</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  icon={<ShieldAlert className="w-8 h-8" />}
                  title="No security logs"
                  description="Security events list is empty."
                />
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.user ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            {log.user.firstName} {log.user.lastName}
                          </span>
                          <span className="text-xs text-surface-400">{log.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-surface-400 text-xs italic">System / Anonymous</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-surface-100 dark:bg-surface-700 rounded font-mono text-xs font-semibold text-surface-800 dark:text-surface-200">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono max-w-[150px] truncate">
                      {log.entityType} ({log.entityId.substring(0, 8)}...)
                    </TableCell>
                    <TableCell className="font-mono text-xs text-surface-500">
                      {log.ipAddress || '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(log.createdAt), 'PPpp')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <TablePagination
              page={page}
              limit={limit}
              total={data.pagination.total}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
};
