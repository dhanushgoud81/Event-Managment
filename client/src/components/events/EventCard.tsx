import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '@/types/event.types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';

interface EventCardProps {
  event: Event;
  isAdmin?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, isAdmin = false }) => {
  const formattedDate = format(new Date(event.startDate), 'PPP');
  const formattedTime = format(new Date(event.startDate), 'p');

  // Get starting price
  const startingPrice = event.ticketCategories && event.ticketCategories.length > 0
    ? Math.min(...event.ticketCategories.map((t) => Number(t.price)))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="hover" padding="none" className="h-full flex flex-col overflow-hidden">
        {/* Banner image */}
        <div className="relative aspect-video w-full overflow-hidden bg-surface-100 dark:bg-surface-800">
          {event.bannerUrl ? (
            <img
              src={event.bannerUrl}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/10 to-accent-500/10">
              <Calendar className="w-12 h-12 text-primary-300" />
            </div>
          )}

          {/* Featured badge */}
          {event.isFeatured && (
            <span className="absolute top-3 left-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-2xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
              Featured
            </span>
          )}

          {/* Status badge for admin */}
          {isAdmin && (
            <div className="absolute top-3 right-3">
              <StatusBadge status={event.status} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white line-clamp-1">
              {event.name}
            </h3>

            {/* Meta */}
            <div className="space-y-1.5 text-sm text-surface-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="truncate">{formattedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            </div>

            <p className="text-surface-500 text-sm line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>

          <div className="border-t border-surface-100 dark:border-surface-700/50 mt-5 pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-400">Tickets from</p>
              <p className="text-base font-black text-primary-600 dark:text-primary-400">
                {startingPrice !== null ? `₹${startingPrice}` : 'Free'}
              </p>
            </div>

            <Link to={isAdmin ? `/admin/events/${event.id}/edit` : `/events/${event.slug}`}>
              <button className="btn-primary btn-sm rounded-lg px-4 py-2 font-semibold">
                {isAdmin ? 'Manage' : 'View Details'}
              </button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
