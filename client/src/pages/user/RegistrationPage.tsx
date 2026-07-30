import React from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEvent } from '@/hooks/useEvents';
import { useCreateRegistration } from '@/hooks/useRegistrations';
import { PageLoader } from '@/components/ui/Spinner';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const RegistrationPage: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>(); // Route is dashboard/my-events/register?ticketId=xyz
  const location = useLocation();
  const navigate = useNavigate();
  const registrationMutation = useCreateRegistration();

  // Read ticketId from query string or location state
  const queryParams = new URLSearchParams(location.search);
  const ticketCategoryId = queryParams.get('ticketId') || location.state?.ticketCategoryId || '';

  const { data, isLoading, error } = useEvent(eventId || '');
  const [responses, setResponses] = React.useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!ticketCategoryId) {
      toast.error('No ticket selected. Please select a ticket category first.');
      navigate(`/events`);
    }
  }, [ticketCategoryId, navigate]);

  if (isLoading) return <PageLoader message="Loading registration form..." />;
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-danger-500" />
        <h2 className="text-xl font-bold">Failed to load registration details</h2>
        <Link to="/events">
          <Button variant="primary">Browse Events</Button>
        </Link>
      </div>
    );
  }

  const event = data.data;
  const ticket = event.ticketCategories?.find((t) => t.id === ticketCategoryId);
  const fields = event.formFields || [];

  const handleResponseChange = (fieldId: string, val: string) => {
    setResponses((prev) => ({ ...prev, [fieldId]: val }));
    // Clear error on edit
    if (formErrors[fieldId]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Perform client side validations
    const errors: Record<string, string> = {};
    fields.forEach((field) => {
      const val = responses[field.id];
      if (field.isRequired && (!val || !val.trim())) {
        errors[field.id] = 'This field is required';
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    const referralCode = localStorage.getItem('applied_referral_code') || undefined;

    const payload = {
      eventId: event.id,
      ticketCategoryId,
      referralCode,
      idempotencyKey: `${event.id}-${ticketCategoryId}-${Date.now()}`,
      responses: Object.entries(responses).map(([formFieldId, value]) => ({
        formFieldId,
        value,
      })),
    };

    registrationMutation.mutate(payload, {
      onSuccess: () => {
        localStorage.removeItem('applied_referral_code');
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/events/${event.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-surface-500 hover:text-surface-900">
        <ArrowLeft className="w-4 h-4" /> Cancel registration
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Register for {event.name}</h1>
        {ticket && (
          <p className="text-surface-500">
            Selected Tier: <span className="font-semibold text-surface-700 dark:text-surface-300">{ticket.name}</span> (₹{ticket.price})
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormRenderer
          fields={fields}
          responses={responses}
          onChange={handleResponseChange}
          errors={formErrors}
        />

        <div className="flex justify-end gap-3">
          <Link to={`/events/${event.slug}`}>
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" size="lg" isLoading={registrationMutation.isPending}>
            {ticket && Number(ticket.price) > 0 ? 'Proceed to Payment' : 'Complete Registration'}
          </Button>
        </div>
      </form>
    </div>
  );
};
