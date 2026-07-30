import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '@/hooks/useTickets';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Dropdown';
import { PageLoader } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table';
import { Plus, Edit, Trash2, ArrowLeft, ArrowRight, Ticket } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TicketCategory } from '@/types/event.types';
import toast from 'react-hot-toast';

const ticketFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(200).optional(),
  price: z.coerce.number().min(0, 'Cannot be negative'),
  maxQuantity: z.coerce.number().int().positive('Must be positive'),
  saleStart: z.string().min(1, 'Sale start date is required'),
  saleEnd: z.string().min(1, 'Sale end date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD_OUT']).default('ACTIVE'),
  sortOrder: z.coerce.number().int().default(0),
});

type TicketForm = z.infer<typeof ticketFormSchema>;

export const TicketManagementPage: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const { data, isLoading } = useTickets(eventId || '');
  const createMutation = useCreateTicket(eventId || '');
  const updateMutation = useUpdateTicket(eventId || '');
  const deleteMutation = useDeleteTicket(eventId || '');

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTicket, setEditingTicket] = React.useState<TicketCategory | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      maxQuantity: 100,
      saleStart: '',
      saleEnd: '',
      status: 'ACTIVE',
      sortOrder: 0,
    },
  });

  const handleOpenCreate = () => {
    setEditingTicket(null);
    reset({
      name: '',
      description: '',
      price: 0,
      maxQuantity: 100,
      saleStart: '',
      saleEnd: '',
      status: 'ACTIVE',
      sortOrder: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ticket: TicketCategory) => {
    setEditingTicket(ticket);
    reset({
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price,
      maxQuantity: ticket.maxQuantity,
      saleStart: ticket.saleStart.slice(0, 16),
      saleEnd: ticket.saleEnd.slice(0, 16),
      status: ticket.status as any,
      sortOrder: ticket.sortOrder,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (dataFields: any) => {
    if (new Date(dataFields.saleStart) >= new Date(dataFields.saleEnd)) {
      toast.error('Sale end date must be after sale start date');
      return;
    }

    if (editingTicket) {
      updateMutation.mutate(
        { id: editingTicket.id, data: dataFields },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    } else {
      createMutation.mutate(dataFields, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this ticket category?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <PageLoader message="Loading ticket categories..." />;

  const tickets = data?.data || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to={`/admin/events/${eventId}/edit`} className="inline-flex items-center gap-1 text-sm font-semibold text-surface-500 hover:text-surface-900">
          <ArrowLeft className="w-4 h-4" /> Back to event
        </Link>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
          Add Ticket Category
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Ticket Categories</h1>
        <p className="text-surface-500">Configure student, professional, VIP, or early bird passes.</p>
      </div>

      {/* Tickets table */}
      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Sales Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon={<Ticket className="w-8 h-8" />}
                title="No ticket categories added"
                description="Add ticket tiers to make registrations active."
                action={<Button size="sm" onClick={handleOpenCreate}>Add Ticket Category</Button>}
              />
            ) : (
              tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-semibold text-surface-900 dark:text-white">
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      {t.description && <span className="text-xs font-normal text-surface-400">{t.description}</span>}
                    </div>
                  </TableCell>
                  <TableCell>₹{t.price}</TableCell>
                  <TableCell>
                    {t.soldQuantity} / {t.maxQuantity}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>Start: {new Date(t.saleStart).toLocaleDateString()}</div>
                    <div>End: {new Date(t.saleEnd).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'ACTIVE' ? 'success' : t.status === 'SOLD_OUT' ? 'danger' : 'surface'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleOpenEdit(t)} className="p-2 rounded-lg text-surface-400 hover:bg-surface-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
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
      </Card>

      {/* Footer next navigation */}
      <div className="flex justify-end pt-4">
        <Link to={`/admin/events/${eventId}/form-builder`}>
          <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
            Next: Configure Registration Form
          </Button>
        </Link>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTicket ? 'Edit Ticket Category' : 'Create Ticket Category'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Category Name" placeholder="e.g. Early Bird Admission" error={errors.name?.message} required {...register('name')} />
          <Input label="Description (Optional)" placeholder="Short info about the ticket privileges..." error={errors.description?.message} {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (INR)" type="number" placeholder="499" error={errors.price?.message} required {...register('price')} />
            <Input label="Max Quantity" type="number" placeholder="200" error={errors.maxQuantity?.message} required {...register('maxQuantity')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Sales Start Date" type="datetime-local" error={errors.saleStart?.message} required {...register('saleStart')} />
            <Input label="Sales End Date" type="datetime-local" error={errors.saleEnd?.message} required {...register('saleEnd')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={watch('status') || 'ACTIVE'}
              onChange={(val) => setValue('status', val as any)}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SOLD_OUT', label: 'Sold Out' },
              ]}
            />
            <Input label="Sort Order" type="number" error={errors.sortOrder?.message} {...register('sortOrder')} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
