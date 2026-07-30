import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEvent, useUpdateEvent, useChangeEventStatus } from '@/hooks/useEvents';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { ArrowLeft, Save, Plus, ClipboardList, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const eventFormSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  venue: z.string().min(3, 'Venue is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  regStartDate: z.string().min(1, 'Registration start date is required'),
  regEndDate: z.string().min(1, 'Registration end date is required'),
  maxParticipants: z.coerce.number().int().positive('Must be positive'),
  organizerName: z.string().optional(),
  organizerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  organizerPhone: z.string().optional(),
  organizerWebsite: z.string().url('Invalid URL format').optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
});

type EventForm = z.infer<typeof eventFormSchema>;

export const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useEvent(id || '');
  const updateMutation = useUpdateEvent(id || '');
  const statusMutation = useChangeEventStatus();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      venue: '',
      address: '',
      city: '',
      state: '',
      country: '',
      startDate: '',
      endDate: '',
      regStartDate: '',
      regEndDate: '',
      maxParticipants: 100,
      organizerName: '',
      organizerEmail: '',
      organizerPhone: '',
      organizerWebsite: '',
      contactEmail: '',
      contactPhone: '',
      tags: '',
      isFeatured: false,
    },
  });

  // Load event details into form fields
  React.useEffect(() => {
    if (data?.data) {
      const e = data.data;
      setValue('name', e.name);
      setValue('description', e.description);
      setValue('venue', e.venue);
      setValue('address', e.address || '');
      setValue('city', e.city || '');
      setValue('state', e.state || '');
      setValue('country', e.country || '');

      // Format ISO strings to datetime-local inputs (YYYY-MM-DDThh:mm)
      const formatToInput = (iso: string) => {
        return iso ? iso.slice(0, 16) : '';
      };
      setValue('startDate', formatToInput(e.startDate));
      setValue('endDate', formatToInput(e.endDate));
      setValue('regStartDate', formatToInput(e.regStartDate));
      setValue('regEndDate', formatToInput(e.regEndDate));

      setValue('maxParticipants', e.maxParticipants);
      setValue('organizerName', e.organizerName || '');
      setValue('organizerEmail', e.organizerEmail || '');
      setValue('organizerPhone', e.organizerPhone || '');
      setValue('organizerWebsite', e.organizerWebsite || '');
      setValue('contactEmail', e.contactEmail || '');
      setValue('contactPhone', e.contactPhone || '');
      setValue('tags', e.tags?.join(', ') || '');
      setValue('isFeatured', e.isFeatured);
    }
  }, [data, setValue]);

  const onSubmit = (formDataFields: any) => {
    const formData = new FormData();
    Object.entries(formDataFields).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        if (key === 'tags') {
          const tagsArray = (val as string).split(',').map((t) => t.trim()).filter(Boolean);
          formData.append('tags', JSON.stringify(tagsArray));
        } else {
          formData.append(key, String(val));
        }
      }
    });

    updateMutation.mutate(formData);
  };

  const handleStatusChange = (status: any) => {
    statusMutation.mutate({ id: id || '', status });
  };

  if (isLoading) return <PageLoader message="Loading event details..." />;

  const event = data?.data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back & Actions header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/admin/events" className="inline-flex items-center gap-1 text-sm font-semibold text-surface-500 hover:text-surface-900">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Link>

        {event && (
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/admin/events/${id}/tickets`}>
              <Button variant="outline" size="sm" leftIcon={<Ticket className="w-4 h-4" />}>
                Configure Tickets
              </Button>
            </Link>
            <Link to={`/admin/events/${id}/form-builder`}>
              <Button variant="outline" size="sm" leftIcon={<ClipboardList className="w-4 h-4" />}>
                Form Builder
              </Button>
            </Link>

            {event.status === 'DRAFT' && (
              <Button variant="primary" size="sm" onClick={() => handleStatusChange('PUBLISHED')}>
                Publish Event
              </Button>
            )}
            {event.status === 'PUBLISHED' && (
              <Button variant="secondary" size="sm" onClick={() => handleStatusChange('CLOSED')}>
                Close Event
              </Button>
            )}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold">Edit Event Details</h1>
        <p className="text-surface-500">Update event branding, venue, schedule, and tags.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Basic Information</h2>
          <Input label="Event Name" error={errors.name?.message} required {...register('name')} />
          <div className="space-y-1.5">
            <label className="label">Event Description *</label>
            <textarea className="input min-h-[120px] py-2" {...register('description')} />
            {errors.description && <p className="text-sm text-danger-500">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Maximum Participants" type="number" error={errors.maxParticipants?.message} required {...register('maxParticipants')} />
            <Input label="Tags (comma-separated)" placeholder="tech, conference" error={errors.tags?.message} {...register('tags')} />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" {...register('isFeatured')} />
              <span className="text-sm font-semibold">Feature this event on homepage</span>
            </label>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Event Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Event Start" type="datetime-local" error={errors.startDate?.message} required {...register('startDate')} />
            <Input label="Event End" type="datetime-local" error={errors.endDate?.message} required {...register('endDate')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Registration Start" type="datetime-local" error={errors.regStartDate?.message} required {...register('regStartDate')} />
            <Input label="Registration End" type="datetime-local" error={errors.regEndDate?.message} required {...register('regEndDate')} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Location</h2>
          <Input label="Venue Name" error={errors.venue?.message} required {...register('venue')} />
          <Input label="Street Address" error={errors.address?.message} {...register('address')} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" error={errors.city?.message} {...register('city')} />
            <Input label="State" error={errors.state?.message} {...register('state')} />
            <Input label="Country" error={errors.country?.message} {...register('country')} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Organizer Contact Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Organizer Name" error={errors.organizerName?.message} {...register('organizerName')} />
            <Input label="Organizer Email" error={errors.organizerEmail?.message} {...register('organizerEmail')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Organizer Phone" error={errors.organizerPhone?.message} {...register('organizerPhone')} />
            <Input label="Organizer Website" error={errors.organizerWebsite?.message} {...register('organizerWebsite')} />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/admin/events">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={updateMutation.isPending} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
