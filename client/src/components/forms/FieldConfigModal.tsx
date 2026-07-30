import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Dropdown';
import { FormField } from '@/types/event.types';

const configSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  fieldType: z.enum([
    'TEXT',
    'EMAIL',
    'PHONE',
    'NUMBER',
    'DATE',
    'TEXTAREA',
    'DROPDOWN',
    'RADIO',
    'CHECKBOX',
  ]),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isRequired: z.boolean().default(false),
  optionsString: z.string().optional(), // Comma separated choices
});

type ConfigForm = z.infer<typeof configSchema>;

interface FieldConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingField: FormField | null;
  nextDisplayOrder: number;
}

export const FieldConfigModal: React.FC<FieldConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingField,
  nextDisplayOrder,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
      label: '',
      fieldType: 'TEXT',
      placeholder: '',
      helpText: '',
      isRequired: false,
      optionsString: '',
    },
  });

  const fieldType = watch('fieldType');
  const showOptions = ['DROPDOWN', 'RADIO', 'CHECKBOX'].includes(fieldType);

  React.useEffect(() => {
    if (editingField) {
      reset({
        label: editingField.label,
        fieldType: editingField.fieldType as any,
        placeholder: editingField.placeholder || '',
        helpText: editingField.helpText || '',
        isRequired: editingField.isRequired,
        optionsString: editingField.options ? editingField.options.join(', ') : '',
      });
    } else {
      reset({
        label: '',
        fieldType: 'TEXT',
        placeholder: '',
        helpText: '',
        isRequired: false,
        optionsString: '',
      });
    }
  }, [editingField, reset, isOpen]);

  const onSubmit = (data: any) => {
    const options = showOptions && data.optionsString
      ? data.optionsString.split(',').map((o: string) => o.trim()).filter(Boolean)
      : null;

    onSave({
      label: data.label,
      fieldType: data.fieldType,
      placeholder: data.placeholder || null,
      helpText: data.helpText || null,
      isRequired: data.isRequired,
      displayOrder: editingField ? editingField.displayOrder : nextDisplayOrder,
      options,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingField ? 'Edit Form Field' : 'Add Custom Form Field'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Field Label"
          placeholder="e.g. T-Shirt Size, Github Profile URL"
          error={errors.label?.message}
          required
          {...register('label')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Field Input Type"
            value={watch('fieldType') || 'TEXT'}
            onChange={(val) => setValue('fieldType', val as any)}
            options={[
              { value: 'TEXT', label: 'Text Input' },
              { value: 'EMAIL', label: 'Email Input' },
              { value: 'PHONE', label: 'Phone Number' },
              { value: 'NUMBER', label: 'Number Input' },
              { value: 'DATE', label: 'Date Input' },
              { value: 'TEXTAREA', label: 'Textarea (Paragraph)' },
              { value: 'DROPDOWN', label: 'Dropdown Select' },
              { value: 'RADIO', label: 'Radio Choices' },
              { value: 'CHECKBOX', label: 'Checkbox Select' },
            ]}
          />

          <div className="flex items-end pb-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                {...register('isRequired')}
              />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Mark as Required
              </span>
            </label>
          </div>
        </div>

        <Input
          label="Placeholder Text"
          placeholder="e.g. Select size or type URL..."
          error={errors.placeholder?.message}
          {...register('placeholder')}
        />

        <Input
          label="Help Text (Optional)"
          placeholder="e.g. Enter full URL including https://"
          error={errors.helpText?.message}
          {...register('helpText')}
        />

        {showOptions && (
          <div className="space-y-1.5">
            <label className="label">Options / Choices *</label>
            <textarea
              placeholder="e.g. Small, Medium, Large, XL"
              className="input min-h-[80px] py-2"
              {...register('optionsString')}
            />
            <p className="text-xs text-surface-500">Provide options as a comma-separated list.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Field</Button>
        </div>
      </form>
    </Modal>
  );
};
