import React from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useDeleteEvent, useChangeEventStatus } from '@/hooks/useEvents';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
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
import { Plus, Edit, Trash2, Calendar, Eye, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const EventsListPage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  const { data, isLoading, error } = useEvents({
    page,
    limit,
    search: search || undefined,
  });

  const deleteMutation = useDeleteEvent();
  const statusMutation = useChangeEventStatus();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: string, status: any) => {
    statusMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-surface-500">Manage all your events, ticket types, and forms.</p>
        </div>
        <Link to="/admin/events/create">
          <Button leftIcon={<Plus className="w-4 h-4" />}>Create Event</Button>
        </Link>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <TableSearch value={search} onChange={(val) => { setSearch(val); setPage(1); }} />
      </div>

      {/* Table */}
      {isLoading ? (
        <PageLoader message="Loading events..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-danger-200 rounded-xl bg-danger-50/50">
          <AlertCircle className="w-10 h-10 text-danger-500 mb-2" />
          <h4 className="font-bold">Error loading events</h4>
          <p className="text-sm text-surface-500">Could not connect to server.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data || data.data.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  icon={<Calendar className="w-8 h-8" />}
                  title="No events found"
                  description="Start by creating your first event."
                  action={
                    <Link to="/admin/events/create">
                      <Button size="sm">Create Event</Button>
                    </Link>
                  }
                />
              ) : (
                data.data.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-semibold text-surface-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>{event.name}</span>
                        <span className="text-xs text-surface-400 font-normal">slug: {event.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(event.startDate), 'PPp')}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{event.venue}</TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell>
                      {event._count?.registrations || 0} / {event.maxParticipants}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Status Toggles */}
                        {event.status === 'DRAFT' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusChange(event.id, 'PUBLISHED')}
                          >
                            Publish
                          </Button>
                        )}
                        {event.status === 'PUBLISHED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(event.id, 'CLOSED')}
                          >
                            Close
                          </Button>
                        )}

                        <Link to={`/events/${event.slug}`} target="_blank">
                          <button className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link to={`/admin/events/${event.id}/edit`}>
                          <button className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600">
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 rounded-lg text-danger-400 hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
