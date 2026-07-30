import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useRegistration } from '@/hooks/useRegistrations';
import { useCreatePaymentOrder, useVerifyPayment } from '@/hooks/usePayments';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wallet, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { load } from '@cashfreepayments/cashfree-js';

export const PaymentsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Read registration ID and order ID from URL query ?regId=xyz&order_id=xyz or location state
  const queryParams = new URLSearchParams(location.search);
  const regId = queryParams.get('regId') || location.state?.registrationId || '';
  const returnedOrderId = queryParams.get('order_id');

  const { data, isLoading, error } = useRegistration(regId);
  const orderMutation = useCreatePaymentOrder();
  const verifyMutation = useVerifyPayment();
  const verificationTriedRef = React.useRef(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!regId) {
      toast.error('No registration reference found');
      navigate('/dashboard/my-tickets');
    }
  }, [regId, navigate]);

  // Handle return URL verification after Cashfree checkout redirect
  React.useEffect(() => {
    if (returnedOrderId && regId && !verificationTriedRef.current) {
      verificationTriedRef.current = true;
      setPaymentErrorMessage(null);
      toast.loading('Verifying payment status with Cashfree...', { id: 'cf-verify' });
      verifyMutation.mutate(
        {
          cashfreeOrderId: returnedOrderId,
          registrationId: regId,
        },
        {
          onSuccess: () => {
            toast.dismiss('cf-verify');
          },
          onError: (err: any) => {
            toast.dismiss('cf-verify');
            const msg = err.response?.data?.message || err.message || 'Payment failed or was cancelled';
            setPaymentErrorMessage(msg);
            // Clean order_id from query params so page resets state cleanly
            navigate(`/dashboard/payments?regId=${regId}`, { replace: true });
          },
        }
      );
    }
  }, [returnedOrderId, regId]);

  const handleCheckout = () => {
    setPaymentErrorMessage(null);
    orderMutation.mutate(
      { registrationId: regId },
      {
        onSuccess: async (response) => {
          const orderData = response.data;

          if (orderData.isMock) {
            // Simulated local payment sandbox mode
            toast.success('Simulating local sandbox checkout...', { duration: 2000 });
            setTimeout(() => {
              verifyMutation.mutate({
                cashfreeOrderId: orderData.cashfreeOrderId,
                registrationId: regId,
              });
            }, 1000);
          } else {
            try {
              const cashfree = await load({
                mode: orderData.environment === 'PRODUCTION' ? 'production' : 'sandbox',
              });

              cashfree.checkout({
                paymentSessionId: orderData.paymentSessionId,
                redirectTarget: '_modal',
              });
            } catch (err: any) {
              toast.error(`Cashfree SDK Initialization failed: ${err.message}`);
            }
          }
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to initiate order';
          setPaymentErrorMessage(msg);
        },
      }
    );
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
        <p className="text-surface-500">Secure ticket payment checkout powered by Cashfree Payments.</p>
      </div>

      {paymentErrorMessage && (
        <div className="p-4 border border-danger-200 bg-danger-50 text-danger-700 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Payment Not Completed</h4>
            <p>{paymentErrorMessage}</p>
          </div>
        </div>
      )}

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
              <span className="text-surface-400">Ticket Base Price:</span>
              <span className="font-semibold">₹{reg.ticketCategory?.price || reg.amountPaid}</span>
            </div>
            {orderMutation.data?.data.referralDiscountApplied && orderMutation.data.data.referralDiscountApplied > 0 ? (
              <div className="flex justify-between text-success-600 dark:text-success-400 font-semibold">
                <span>Referral Discount:</span>
                <span>- ₹{orderMutation.data.data.referralDiscountApplied}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-dashed border-surface-100 dark:border-surface-700/50">
              <span>Payable Amount:</span>
              <span className="text-primary-600 dark:text-primary-400">
                ₹{orderMutation.data?.data.amount !== undefined ? orderMutation.data.data.amount : reg.amountPaid}
              </span>
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
            {paymentErrorMessage ? 'Retry Payment' : 'Pay Now (Cashfree Secure Checkout)'}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-surface-400">
            <ShieldCheck className="w-4 h-4 text-success-500" />
            <span>Payments processed securely via Cashfree Gateway (256-bit SSL).</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
