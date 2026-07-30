import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Save, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      siteName: 'EventHub Ticketing',
      supportEmail: 'support@eventmanagement.com',
      maxAttachmentSize: 5,
    },
  });

  const onSubmit = (data: any) => {
    // Simulated settings save (local storage or dummy success)
    toast.success('System configuration saved successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="text-primary-500 w-6 h-6" />
          Global System Settings
        </h1>
        <p className="text-surface-500">Manage base branding, system settings, and customer support channels.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="space-y-4">
          <h3 className="font-bold text-lg text-surface-900 dark:text-white">General Configurations</h3>

          <Input
            label="Application Site Title"
            placeholder="e.g. EventHub"
            {...register('siteName')}
          />

          <Input
            label="Support Desk Contact Email"
            type="email"
            placeholder="support@event.com"
            {...register('supportEmail')}
          />

          <Input
            label="Max File Attachments Capacity (MB)"
            type="number"
            placeholder="5"
            {...register('maxAttachmentSize')}
          />
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
            Save System Configurations
          </Button>
        </div>
      </form>
    </div>
  );
};
