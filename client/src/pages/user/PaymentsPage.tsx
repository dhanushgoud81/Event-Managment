import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useRegistration } from '@/hooks/useRegistrations';
import { useCreatePaymentOrder, useVerifyPayment } from '@/hooks/usePayments';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wallet, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const PaymentsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Read registration ID from URL query ?regId=xyz or state
  const queryParams = new URLSearchParams(location.search);
  const regId = queryParams.get('regId') || location.state?.registrationId || '';

  const { data, isLoading, error } = useRegistration(regId);
  const orderMutation = useCreatePaymentOrder();
  const verifyMutation = useVerifyPayment();

  React.useEffect(() => {
    if (!regId) {
      toast.error('No registration reference found');
      navigate('/dashboard/my-tickets');
    }
  }, [regId, navigate]);

  const handleCheckout = () => {
    orderMutation.mutate(
      { registrationId: regId },
      {
        onSuccess: (response) => {
          const orderData = response.data;

          if (orderData.isMock) {
            // Simulated local payment sandbox (no keys)
            toast.success('Simulating local sandbox checkout...', { duration: 3000 });
            setTimeout(() => {
              verifyMutation.mutate({
                razorpayOrderId: orderData.razorpayOrderId,
                razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(7)}`,
                razorpaySignature: 'mock_sig',
                registrationId: regId,
              });
            }, 1500);
          } else {
            // Setup Razorpay Checkout integration
            const options = {
              key: orderData.keyId,
              amount: orderData.amount * 100,
              currency: orderData.currency,
              name: 'EventHub Ticketing',
              description: `Admission Pass for ${orderData.registration.event?.name}`,
              order_id: orderData.razorpayOrderId,
              handler: (res: any) => {
                verifyMutation.mutate({
                  razorpayOrderId: orderData.razorpayOrderId,
                  razorpayPaymentId: res.razorpay_payment_id,
                  razorpaySignature: res.razorpay_signature,
                  registrationId: regId,
                });
              },
              prefill: {
                name: `${orderData.registration.user?.firstName} ${orderData.registration.user?.lastName}`,
                email: orderData.registration.user?.email,
              },
              theme: {
                color: '#6366f1',
              },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', (err: any) => {
              toast.error(`Checkout failed: ${err.error.description}`);
            });
            rzp.open();
          }
        },
      }
    );
  };

  // Add Razorpay CDN script dynamically in case of production execution
  React.useEffect(() => {
    if (data && Number(data.data.amountPaid) > 0 && !configPaymentsMocked()) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [data]);

  const configPaymentsMocked = () => {
    return orderMutation.data?.data.isMock ?? true;
  };

  if (isLoading) return <PageLoader message="Loading checkout portal..." />;
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-danger-500" />
        <h2 className="text-xl font-bold">Failed to load registration details</h2>
        <Link to="/dashboard/my-tickets">
          <Button variant="primary">My Tickets</Button>
        </Link>
      </div>
    );
  }

  const reg = data.data;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold">Admission Pass Checkout</h1>
        <p className="text-surface-500">Secure ticket payment checkout using Razorpay.</p>
      </div>

      <Card className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white">{reg.event?.name}</h3>
              <p className="text-xs text-surface-500">Ref: {reg.registrationNumber}</p>
            </div>
          </div>

          {/* Details breakdown */}
          <div className="border-t border-b border-surface-100 dark:border-surface-700/50 py-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-400">Category Pass:</span>
              <span className="font-semibold">{reg.ticketCategory?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Subtotal:</span>
              <span className="font-semibold">₹{reg.amountPaid}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-dashed border-surface-100 dark:border-surface-700/50">
              <span>Total Amount:</span>
              <span className="text-primary-600 dark:text-primary-400">₹{reg.amountPaid}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            fullWidth
            size="lg"
            onClick={handleCheckout}
            isLoading={orderMutation.isPending || verifyMutation.isPending}
          >
            Pay Now (Secure Check-out)
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-surface-400">
            <ShieldCheck className="w-4 h-4 text-success-500" />
            <span>Payments processed using Razorpay (SSL encrypted).</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
