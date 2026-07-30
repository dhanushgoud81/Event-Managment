import React from 'react';
import { FormField } from '@/types/event.types';
import { Input } from '@/components/ui/Input';
import { clsx } from 'clsx';

interface DynamicFieldProps {
  field: FormField;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const options = field.options || [];

  switch (field.fieldType) {
    case 'TEXT':
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder || ''}
          hint={field.helpText || ''}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required={field.isRequired}
        />
      );

    case 'EMAIL':
      return (
        <Input
          label={field.label}
          type="email"
          placeholder={field.placeholder || 'you@example.com'}
          hint={field.helpText || ''}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required={field.isRequired}
        />
      );

    case 'PHONE':
      return (
        <Input
          label={field.label}
          type="tel"
          placeholder={field.placeholder || '+91XXXXXXXXXX'}
          hint={field.helpText || ''}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required={field.isRequired}
        />
      );

    case 'NUMBER':
      return (
        <Input
          label={field.label}
          type="number"
          placeholder={field.placeholder || ''}
          hint={field.helpText || ''}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required={field.isRequired}
        />
      );

    case 'DATE':
      return (
        <Input
          label={field.label}
          type="date"
          hint={field.helpText || ''}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required={field.isRequired}
        />
      );

    case 'TEXTAREA':
      return (
        <div className="space-y-1.5">
          <label className="label">
            {field.label}
            {field.isRequired && <span className="text-danger-500 ml-1">*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            className={clsx('input min-h-[100px] py-2', error && 'input-error')}
          />
          {error && <p className="text-sm text-danger-500">{error}</p>}
          {field.helpText && <p className="text-xs text-surface-500">{field.helpText}</p>}
        </div>
      );

    case 'DROPDOWN':
      return (
        <div className="space-y-1.5">
          <label className="label">
            {field.label}
            {field.isRequired && <span className="text-danger-500 ml-1">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={clsx('input', error && 'input-error')}
          >
            <option value="">Choose an option...</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          {field.helpText && <p className="text-xs text-surface-500">{field.helpText}</p>}
        </div>
      );

    case 'RADIO':
      return (
        <div className="space-y-1.5">
          <label className="label">
            {field.label}
            {field.isRequired && <span className="text-danger-500 ml-1">*</span>}
          </label>
          <div className="space-y-2">
            {options.map((opt: string) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4 text-primary-500 border-surface-300 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">{opt}</span>
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          {field.helpText && <p className="text-xs text-surface-500">{field.helpText}</p>}
        </div>
      );

    case 'CHECKBOX':
      const list = value ? value.split(',').map((s) => s.trim()) : [];
      const handleToggle = (opt: string) => {
        const index = list.indexOf(opt);
        if (index > -1) {
          list.splice(index, 1);
        } else {
          list.push(opt);
        }
        onChange(list.join(', '));
      };

      return (
        <div className="space-y-1.5">
          <label className="label">
            {field.label}
            {field.isRequired && <span className="text-danger-500 ml-1">*</span>}
          </label>
          <div className="space-y-2">
            {options.map((opt: string) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={list.includes(opt)}
                  onChange={() => handleToggle(opt)}
                  className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">{opt}</span>
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          {field.helpText && <p className="text-xs text-surface-500">{field.helpText}</p>}
        </div>
      );

    default:
      return null;
  }
};
