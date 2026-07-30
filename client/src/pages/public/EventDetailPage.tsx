import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEvent } from '@/hooks/useEvents';
import { PageLoader } from '@/components/ui/Spinner';
import { TicketSelector } from '@/components/events/TicketSelector';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Share2,
  Sparkles,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const EventDetailPage: React.FC = () => {
  const { id: idOrSlug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useEvent(idOrSlug || '');
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Event link copied to clipboard!');
  };

  const handleRegister = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to purchase tickets');
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (!selectedTicketId) {
      toast.error('Please select a ticket category');
      return;
    }

    // Redirect to registration wizard step 2 (form inputs)
    navigate(`/events/${data!.data.id}/register?ticketId=${selectedTicketId}`);
  };

  if (isLoading) return <PageLoader message="Loading event details..." />;
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Event Not Found</h2>
        <p className="text-surface-500">The event page you are looking for does not exist or has been removed.</p>
        <Link to="/events">
          <Button variant="primary">Go back to Events</Button>
        </Link>
      </div>
    );
  }

  const event = data.data;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const isRegistrationOpen =
    new Date() >= new Date(event.regStartDate) &&
    new Date() <= new Date(event.regEndDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-surface-500 hover:text-surface-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to events
      </Link>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/10 to-accent-500/10">
                <Calendar className="w-16 h-16 text-primary-300" />
              </div>
            )}
            {event.isFeatured && (
              <span className="absolute top-4 left-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                Featured Event
              </span>
            )}
          </div>

          {/* Title & Desc */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-white leading-tight">
              {event.name}
            </h1>
            <p className="text-surface-700 dark:text-surface-300 text-base leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        </div>

        {/* Right Col - Checkout Widget */}
        <div className="space-y-6">
          <Card className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">Event Info</h2>

              {/* Specs */}
              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">Date</p>
                    <p className="text-surface-500">{format(startDate, 'PPPP')}</p>
                    {format(startDate, 'p') !== format(endDate, 'p') && (
                      <p className="text-xs text-surface-400">
                        Ends {format(endDate, 'PPP')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">Time</p>
                    <p className="text-surface-500">
                      {format(startDate, 'p')} - {format(endDate, 'p')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">Venue</p>
                    <p className="text-surface-500">{event.venue}</p>
                    {event.address && <p className="text-xs text-surface-400">{event.address}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Selector */}
            {isRegistrationOpen && event.ticketCategories ? (
              <div className="border-t border-surface-200 dark:border-surface-700 pt-5 space-y-4">
                <TicketSelector
                  tickets={event.ticketCategories}
                  selectedTicketId={selectedTicketId}
                  onSelect={setSelectedTicketId}
                />

                <Button fullWidth size="lg" onClick={handleRegister}>
                  Register Now
                </Button>
              </div>
            ) : (
              <div className="border-t border-surface-200 dark:border-surface-700 pt-5 flex items-start gap-2 bg-surface-50 dark:bg-surface-800/30 p-4 rounded-xl">
                <Info className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-surface-600 dark:text-surface-400">
                  <p className="font-bold text-surface-900 dark:text-white mb-0.5">Registration Closed</p>
                  <p>
                    Registration is open from {format(new Date(event.regStartDate), 'PP')} to{' '}
                    {format(new Date(event.regEndDate), 'PP')}.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-surface-200 dark:border-surface-700">
              <Button variant="secondary" fullWidth leftIcon={<Share2 className="w-4 h-4" />} onClick={handleShare}>
                Share
              </Button>
            </div>
          </Card>

          {/* Organizer details */}
          {event.organizerName && (
            <Card className="space-y-4">
              <h3 className="font-bold text-surface-900 dark:text-white">Organizer Details</h3>
              <div className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <p className="font-semibold text-surface-800 dark:text-surface-200">{event.organizerName}</p>
                {event.organizerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-surface-400" />
                    <span className="truncate">{event.organizerEmail}</span>
                  </div>
                )}
                {event.organizerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-surface-400" />
                    <span>{event.organizerPhone}</span>
                  </div>
                )}
                {event.organizerWebsite && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-surface-400" />
                    <a href={event.organizerWebsite} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline truncate">
                      {event.organizerWebsite}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
