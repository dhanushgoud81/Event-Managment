import React from 'react';
import { usePayments } from '@/hooks/usePayments';
import { PageLoader } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/Badge';
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
import { DollarSign, Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const PaymentsListPage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  const { data, isLoading, error, refetch } = usePayments({
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Transaction History</h1>
          <p className="text-sm text-surface-500">Track registration checkouts and signature verifications.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg text-surface-500"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table search controls */}
      <div className="flex items-center justify-between">
        <TableSearch value={search} onChange={(val) => { setSearch(val); setPage(1); }} />
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader message="Loading transactions..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-danger-50/50">
          <AlertCircle className="w-10 h-10 text-danger-500 mb-2" />
          <h4 className="font-bold">Error loading payments</h4>
          <p className="text-sm text-surface-500">Failed to load transactions log.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-800 border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction Ref</TableHead>
                <TableHead>User / Email</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Gateway Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data || data.data.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  icon={<DollarSign className="w-8 h-8" />}
                  title="No transaction records"
                  description="No tickets checkouts have been initiated yet."
                />
              ) : (
                data.data.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-2xs uppercase text-surface-900 dark:text-white">
                      {payment.orderId}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {payment.user?.firstName} {payment.user?.lastName}
                        </span>
                        <span className="text-xs text-surface-400">{payment.user?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {payment.registration?.event?.name || 'Deleted Event'}
                    </TableCell>
                    <TableCell className="font-bold">
                      ₹{payment.amount}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-surface-400">
                      {payment.razorpayOrderId || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(payment.createdAt), 'PPp')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.pagination && data.pagination.totalPages > 1 && (
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
