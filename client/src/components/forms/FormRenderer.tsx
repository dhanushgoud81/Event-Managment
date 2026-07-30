import React from 'react';
import { FormField } from '@/types/event.types';
import { DynamicField } from './DynamicField';
import { Card } from '@/components/ui/Card';

interface FormRendererProps {
  fields: FormField[];
  responses: Record<string, string>;
  onChange: (fieldId: string, val: string) => void;
  errors?: Record<string, string>;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  fields,
  responses,
  onChange,
  errors = {},
}) => {
  if (fields.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-5">
      <h3 className="text-lg font-bold text-surface-900 dark:text-white border-b border-surface-100 dark:border-surface-700/50 pb-3">
        Attendee Information
      </h3>

      <div className="space-y-4">
        {fields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={responses[field.id] || ''}
            onChange={(val) => onChange(field.id, val)}
            error={errors[field.id]}
          />
        ))}
      </div>
    </Card>
  );
};
