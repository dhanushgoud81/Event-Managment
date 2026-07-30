import React from 'react';
import { TicketCategory } from '@/types/event.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Minus } from 'lucide-react';

interface TicketSelectorProps {
  tickets: TicketCategory[];
  selectedTicketId: string | null;
  onSelect: (ticketId: string) => void;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({
  tickets,
  selectedTicketId,
  onSelect,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-surface-900 dark:text-white">
        Choose Your Ticket
      </h3>

      {tickets.length === 0 ? (
        <p className="text-sm text-surface-500">No tickets available for this event.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {tickets.map((ticket) => {
            const isSelected = selectedTicketId === ticket.id;
            const isSoldOut = ticket.soldQuantity >= ticket.maxQuantity || ticket.status === 'SOLD_OUT';
            const isInactive = ticket.status === 'INACTIVE';
            const isDisabled = isSoldOut || isInactive;

            return (
              <Card
                key={ticket.id}
                onClick={() => !isDisabled && onSelect(ticket.id)}
                className={`flex justify-between items-center transition-all cursor-pointer p-4 border-2 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/10'
                    : isDisabled
                    ? 'border-surface-200 opacity-60 cursor-not-allowed'
                    : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-surface-900 dark:text-white">
                      {ticket.name}
                    </h4>
                    {isSoldOut && <Badge variant="danger">Sold Out</Badge>}
                    {isInactive && <Badge variant="surface">Unavailable</Badge>}
                  </div>
                  {ticket.description && (
                    <p className="text-xs text-surface-500 max-w-md">
                      {ticket.description}
                    </p>
                  )}
                  <p className="text-xs text-surface-400">
                    Sale ends {new Date(ticket.saleEnd).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-black text-primary-600 dark:text-primary-400">
                    ₹{ticket.price}
                  </p>
                  <p className="text-xs text-surface-400">
                    {ticket.maxQuantity - ticket.soldQuantity} spots left
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
