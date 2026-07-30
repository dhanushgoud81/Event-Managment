import React from 'react';
import { FormField } from '@/types/event.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table';
import { Plus, Edit, Trash2, GripVertical, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { FieldConfigModal } from './FieldConfigModal';
import { useFormFields, useCreateFormField, useUpdateFormField, useDeleteFormField, useReorderFormFields } from '@/hooks/useForms';

interface FormBuilderProps {
  eventId: string;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ eventId }) => {
  const { data, isLoading } = useFormFields(eventId);
  const createMutation = useCreateFormField(eventId);
  const updateMutation = useUpdateFormField(eventId);
  const deleteMutation = useDeleteFormField(eventId);
  const reorderMutation = useReorderFormFields(eventId);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingField, setEditingField] = React.useState<FormField | null>(null);

  const fields = data?.data || [];

  const handleOpenCreate = () => {
    setEditingField(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (field: FormField) => {
    setEditingField(field);
    setIsModalOpen(true);
  };

  const handleSave = (fieldData: any) => {
    if (editingField) {
      updateMutation.mutate(
        { id: editingField.id, data: fieldData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createMutation.mutate(fieldData, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this custom form field?')) {
      deleteMutation.mutate(id);
    }
  };

  // Move fields up/down for displayOrder
  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === fields.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const reorderedFields = [...fields];

    // Swap displayOrder values
    const tempOrder = reorderedFields[index].displayOrder;
    reorderedFields[index] = { ...reorderedFields[index], displayOrder: reorderedFields[targetIndex].displayOrder };
    reorderedFields[targetIndex] = { ...reorderedFields[targetIndex], displayOrder: tempOrder };

    const payload = {
      fields: reorderedFields.map((f) => ({ id: f.id, displayOrder: f.displayOrder })),
    };

    reorderMutation.mutate(payload);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-surface-900 dark:text-white">
          Custom Registration Fields
        </h3>
        <Button size="sm" leftIcon={<Plus className="w-4.5 h-4.5" />} onClick={handleOpenCreate}>
          Add Custom Field
        </Button>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Field Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Options</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon={<Plus className="w-8 h-8" />}
                title="No custom form fields"
                description="The default form collects Name and Email. Add custom questions if needed."
                action={<Button size="sm" onClick={handleOpenCreate}>Add Custom Field</Button>}
              />
            ) : (
              fields.map((field, idx) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1.5 text-surface-400">
                      <button
                        onClick={() => handleMove(idx, 'UP')}
                        disabled={idx === 0}
                        className="hover:text-primary-500 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'DOWN')}
                        disabled={idx === fields.length - 1}
                        className="hover:text-primary-500 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-surface-900 dark:text-white">
                    <div className="flex flex-col">
                      <span>{field.label}</span>
                      {field.helpText && <span className="text-xs font-normal text-surface-400">{field.helpText}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs uppercase font-mono px-2 py-0.5 bg-surface-100 rounded text-surface-600">
                      {field.fieldType}
                    </span>
                  </TableCell>
                  <TableCell>{field.isRequired ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-xs text-surface-500">
                    {field.options ? field.options.join(', ') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenEdit(field)} className="p-2 rounded-lg text-surface-400 hover:bg-surface-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-lg text-danger-400 hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <FieldConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingField={editingField}
        nextDisplayOrder={fields.length}
      />
    </div>
  );
};
