import React from 'react';
import { useReferralSettings, useUpdateReferralSettings } from '@/hooks/useReferrals';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const referralSettingFormSchema = z.object({
  isActive: z.boolean().default(false),
  rewardAmount: z.coerce.number().min(0, 'Must be positive'),
});

type ReferralSettingForm = z.infer<typeof referralSettingFormSchema>;

export const ReferralSettingsPage: React.FC = () => {
  const { data, isLoading } = useReferralSettings();
  const updateMutation = useUpdateReferralSettings();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(referralSettingFormSchema),
    defaultValues: {
      isActive: false,
      rewardAmount: 0,
    },
  });

  React.useEffect(() => {
    if (data?.data) {
      setValue('isActive', data.data.isActive);
      setValue('rewardAmount', data.data.rewardAmount);
    }
  }, [data, setValue]);

  const onSubmit = (dataFields: any) => {
    updateMutation.mutate(dataFields);
  };

  if (isLoading) return <PageLoader message="Loading settings..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="text-primary-500 w-6 h-6" />
          Referral & Rewards Settings
        </h1>
        <p className="text-surface-500">Configure affiliate commissions paid to users for driving ticket checkouts.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="space-y-5">
          {/* Active status */}
          <div className="flex items-center justify-between border-b pb-4 border-surface-100 dark:border-surface-700/50">
            <div>
              <p className="font-bold text-surface-900 dark:text-white">Enable Referral Program</p>
              <p className="text-xs text-surface-500 mt-0.5">Allow users to apply referral codes and earn wallet balance.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                {...register('isActive')}
              />
            </label>
          </div>

          {/* Reward Amount */}
          <Input
            label="Affiliate Reward Credits per Checkout (INR)"
            type="number"
            placeholder="100"
            error={errors.rewardAmount?.message}
            required
            {...register('rewardAmount')}
          />
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button type="submit" isLoading={updateMutation.isPending} leftIcon={<Save className="w-4 h-4" />}>
            Save Referral Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
