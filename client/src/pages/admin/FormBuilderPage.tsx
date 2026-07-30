import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Check, ClipboardList } from 'lucide-react';

export const FormBuilderPage: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header links */}
      <div className="flex items-center justify-between">
        <Link to={`/admin/events/${eventId}/tickets`} className="inline-flex items-center gap-1 text-sm font-semibold text-surface-500 hover:text-surface-900">
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </Link>
        <Link to="/admin/events">
          <Button leftIcon={<Check className="w-4.5 h-4.5" />}>Finish Configuration</Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary-500" />
          Registration Form Builder
        </h1>
        <p className="text-surface-500">Step 3: Define survey questions, T-shirt inputs, or rules compliance checkbox queries.</p>
      </div>

      <FormBuilder eventId={eventId || ''} />
    </div>
  );
};
