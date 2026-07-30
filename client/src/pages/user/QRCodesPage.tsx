import React from 'react';
import { useMyRegistrations } from '@/hooks/useRegistrations';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { QrCode, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const QRCodesPage: React.FC = () => {
  const { data, isLoading } = useMyRegistrations();

  if (isLoading) return <PageLoader message="Loading QR passes..." />;

  const confirmedRegs = (data?.data || []).filter((r) => r.status === 'CONFIRMED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">QR Access Passes</h1>
        <p className="text-surface-500">Collect and display verified check-in badges at event entrance gates.</p>
      </div>

      {confirmedRegs.length === 0 ? (
        <Card className="text-center py-12 flex flex-col items-center justify-center space-y-3">
          <QrCode className="w-12 h-12 text-surface-300" />
          <h3 className="text-lg font-bold">No active QR passes</h3>
          <p className="text-surface-500 max-w-sm">QR passes are generated automatically after successful registration and ticket checkout.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {confirmedRegs.map((reg) => (
            <Card key={reg.id} className="flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-40 h-40 bg-white p-2 border rounded-xl flex items-center justify-center shadow">
                <img
                  src={
                    reg.qrCode?.qrImageUrl ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK-${reg.registrationNumber}`
                  }
                  alt="QR Code Badge"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h3 className="font-bold text-surface-950 dark:text-white truncate max-w-[200px]">{reg.event?.name}</h3>
                <p className="text-xs text-surface-400 mt-1">Ref: {reg.registrationNumber}</p>
                <p className="text-2xs text-primary-500 font-bold uppercase tracking-wider mt-1.5">
                  {reg.ticketCategory?.name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
