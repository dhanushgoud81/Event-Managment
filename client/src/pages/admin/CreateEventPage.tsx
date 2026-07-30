import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateEvent } from '@/hooks/useEvents';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

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

export const CreateEventPage: React.FC = () => {
  const createMutation = useCreateEvent();
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = (data: any) => {
    // Basic date validations before API
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const regStart = new Date(data.regStartDate);
    const regEnd = new Date(data.regEndDate);

    if (start >= end) {
      toast.error('Event end date must be after start date');
      return;
    }
    if (regStart >= regEnd) {
      toast.error('Registration end date must be after registration start date');
      return;
    }
    if (regEnd > start) {
      toast.error('Registration must end before or at the start of the event');
      return;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        if (key === 'tags') {
          const tagsArray = (val as string).split(',').map((t) => t.trim()).filter(Boolean);
          formData.append('tags', JSON.stringify(tagsArray));
        } else {
          formData.append(key, String(val));
        }
      }
    });

    if (bannerFile) {
      formData.append('banner', bannerFile);
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Create New Event</h1>
        <p className="text-surface-500">Step 1: Set up event schedule, location, and description.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Banner Upload */}
        <Card className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-surface-300 dark:border-surface-700 hover:border-primary-500 transition-colors relative cursor-pointer min-h-[200px]">
          {previewUrl ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setBannerFile(null); setPreviewUrl(null); }}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <ImageIcon className="w-12 h-12 text-surface-300 mx-auto" />
              <div>
                <p className="font-semibold text-sm">Upload Event Banner</p>
                <p className="text-xs text-surface-500 mt-1">Recommended aspect ratio: 16:9 (max 5MB)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          )}
        </Card>

        {/* Basic Details */}
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Event Details</h2>
          <Input label="Event Name" placeholder="e.g. tech conference 2026" error={errors.name?.message} required {...register('name')} />
          <div className="space-y-1.5">
            <label className="label">Event Description <span className="text-danger-500">*</span></label>
            <textarea className="input min-h-[120px] py-2" placeholder="Describe the event contents..." {...register('description')} />
            {errors.description && <p className="text-sm text-danger-500">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Maximum Participants" type="number" placeholder="500" error={errors.maxParticipants?.message} required {...register('maxParticipants')} />
            <Input label="Tags (comma-separated)" placeholder="tech, coding, nodejs" error={errors.tags?.message} {...register('tags')} />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" {...register('isFeatured')} />
              <span className="text-sm font-semibold">Feature this event on homepage</span>
            </label>
          </div>
        </Card>

        {/* Dates */}
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Event Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Event Start Date & Time" type="datetime-local" error={errors.startDate?.message} required {...register('startDate')} />
            <Input label="Event End Date & Time" type="datetime-local" error={errors.endDate?.message} required {...register('endDate')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Registration Start Date" type="datetime-local" error={errors.regStartDate?.message} required {...register('regStartDate')} />
            <Input label="Registration End Date" type="datetime-local" error={errors.regEndDate?.message} required {...register('regEndDate')} />
          </div>
        </Card>

        {/* Venue / Location */}
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Event Location</h2>
          <Input label="Venue Name" placeholder="e.g. Grand Plaza Auditorium" error={errors.venue?.message} required {...register('venue')} />
          <Input label="Street Address" placeholder="123 Main St" error={errors.address?.message} {...register('address')} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" placeholder="San Francisco" error={errors.city?.message} {...register('city')} />
            <Input label="State" placeholder="CA" error={errors.state?.message} {...register('state')} />
            <Input label="Country" placeholder="United States" error={errors.country?.message} {...register('country')} />
          </div>
        </Card>

        {/* Organizer info */}
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Organizer details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Organizer Name" placeholder="EventHub LLC" error={errors.organizerName?.message} {...register('organizerName')} />
            <Input label="Organizer Email" placeholder="organizer@eventhub.com" error={errors.organizerEmail?.message} {...register('organizerEmail')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Organizer Phone" placeholder="+1234567890" error={errors.organizerPhone?.message} {...register('organizerPhone')} />
            <Input label="Organizer Website" placeholder="https://organizer.com" error={errors.organizerWebsite?.message} {...register('organizerWebsite')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Email" placeholder="support@organizer.com" error={errors.contactEmail?.message} {...register('contactEmail')} />
            <Input label="Contact Phone" placeholder="+1234567890" error={errors.contactPhone?.message} {...register('contactPhone')} />
          </div>
        </Card>

        {/* Footer actions */}
        <div className="flex justify-end gap-3">
          <Link to="/admin/events">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={createMutation.isPending} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Next: Configure Tickets
          </Button>
        </div>
      </form>
    </div>
  );
};
