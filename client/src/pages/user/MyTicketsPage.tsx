import React from 'react';
import { useMyRegistrations } from '@/hooks/useRegistrations';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Calendar, MapPin, QrCode, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const MyTicketsPage: React.FC = () => {
  const { data, isLoading, error } = useMyRegistrations();
  const [selectedRegId, setSelectedRegId] = React.useState<string | null>(null);

  if (isLoading) return <PageLoader message="Loading your tickets..." />;

  const registrations = data?.data || [];

  const activeReg = registrations.find((r) => r.id === selectedRegId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Event Tickets</h1>
        <p className="text-surface-500">View confirmations, scan entrance QR codes, and check payment statuses.</p>
      </div>

      {registrations.length === 0 ? (
        <Card className="text-center py-12 flex flex-col items-center justify-center space-y-3">
          <Calendar className="w-12 h-12 text-surface-300" />
          <h3 className="text-lg font-bold">No registered events yet</h3>
          <p className="text-surface-500 max-w-sm">Browse our active events list and register today!</p>
          <a href="/events" className="btn-primary btn-sm rounded-lg px-4 py-2 mt-2 font-semibold">
            Explore Events
          </a>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registrations.map((reg) => {
            const isConfirmed = reg.status === 'CONFIRMED';
            const isPending = reg.status === 'PENDING';

            return (
              <Card key={reg.id} className="flex flex-col justify-between h-full border-t-4 border-t-primary-500">
                <div className="space-y-4">
                  {/* Event Meta */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-surface-900 dark:text-white line-clamp-1">
                        {reg.event?.name}
                      </h3>
                      <p className="text-xs text-surface-400 mt-0.5">
                        Ref No: {reg.registrationNumber}
                      </p>
                    </div>
                    <Badge variant={isConfirmed ? 'success' : isPending ? 'warning' : 'danger'}>
                      {reg.status}
                    </Badge>
                  </div>

                  {/* Info Row */}
                  <div className="space-y-2 text-sm text-surface-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span>
                        {reg.event?.startDate ? format(new Date(reg.event.startDate), 'PPP p') : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span className="truncate">{reg.event?.venue}</span>
                    </div>
                  </div>

                  {/* Ticket details */}
                  <div className="bg-surface-50 dark:bg-surface-800/40 p-3 rounded-lg flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-surface-800 dark:text-surface-200">
                        {reg.ticketCategory?.name}
                      </p>
                      <p className="text-xs text-surface-400">Category Tier</p>
                    </div>
                    <p className="font-black text-primary-600 dark:text-primary-400">
                      {Number(reg.amountPaid) === 0 ? 'Free' : `₹${reg.amountPaid}`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-surface-100 dark:border-surface-700/50 mt-4 flex items-center justify-end gap-2">
                  {isPending && (
                    <a href={`/dashboard/payments?regId=${reg.id}`} className="btn-primary btn-sm rounded-lg px-4 py-2 font-semibold">
                      Complete Payment
                    </a>
                  )}

                  {isConfirmed && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<QrCode className="w-4 h-4" />}
                      onClick={() => setSelectedRegId(reg.id)}
                    >
                      View QR Pass
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Confirmation Modal */}
      <Modal
        isOpen={!!selectedRegId}
        onClose={() => setSelectedRegId(null)}
        title="Check-in QR Ticket Pass"
      >
        {activeReg && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-5">
            <div>
              <h3 className="font-bold text-lg text-surface-900 dark:text-white">
                {activeReg.event?.name}
              </h3>
              <p className="text-xs text-surface-400 mt-1">
                Reference Number: {activeReg.registrationNumber}
              </p>
            </div>

            {/* QR Image Box */}
            <div className="w-48 h-48 bg-white p-3 border rounded-xl shadow flex items-center justify-center">
              {/* If qrcode is not loaded, show simulator fallback URL */}
              <img
                src={
                  activeReg.qrCode?.qrImageUrl ||
                  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK-${activeReg.registrationNumber}`
                }
                alt="QR Code Ticket"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1.5 text-xs text-surface-500 bg-surface-50 dark:bg-surface-800/40 p-4 rounded-xl w-full">
              <p className="font-bold text-surface-800 dark:text-surface-200">
                Holder Name: {activeReg.user?.firstName || 'Attendee'}
              </p>
              <p>Show this code to the event coordinators at entrance desk for instant check-in verification.</p>
            </div>

            <Button fullWidth onClick={() => setSelectedRegId(null)}>
              Close Ticket
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
