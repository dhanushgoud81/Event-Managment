import React from 'react';
import { useMyReferrals, useApplyReferral, useWallet } from '@/hooks/useReferrals';
import { useAuthStore } from '@/store/auth.store';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table';
import { Users, Copy, Sparkles, Send, Check } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ReferralsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: walletData } = useWallet();
  const { data: referralsData, isLoading } = useMyReferrals();
  const applyMutation = useApplyReferral();

  const [refCodeInput, setRefCodeInput] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (!user?.referralCode) return;
    const link = `${window.location.origin}/register?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refCodeInput.trim()) return;
    applyMutation.mutate(
      { referralCode: refCodeInput.trim().toUpperCase() },
      {
        onSuccess: () => setRefCodeInput(''),
      }
    );
  };

  if (isLoading) return <PageLoader message="Loading referrals..." />;

  const referrals = referralsData?.data || [];
  const referralLink = user?.referralCode
    ? `${window.location.origin}/register?ref=${user.referralCode}`
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Referral Dashboard</h1>
        <p className="text-surface-500">Invite your friends to register and earn wallet rewards on successful checkouts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral code copy widget */}
        <Card className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-1.5 text-surface-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
            Invite Friends & Earn
          </h3>
          <p className="text-sm text-surface-500">
            Share your unique code. When your friends register and complete ticket payments, rewards will be added straight to your wallet.
          </p>

          {/* Copy Box */}
          <div className="flex gap-2 items-center bg-surface-50 dark:bg-surface-850 p-3.5 rounded-xl border border-surface-200 dark:border-surface-700/50">
            <div className="flex-1 truncate select-all font-mono text-sm text-surface-700 dark:text-surface-300">
              {referralLink || 'Loading link...'}
            </div>
            <Button
              size="sm"
              variant={copied ? 'secondary' : 'primary'}
              leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyLink}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="flex gap-4 pt-2 text-sm text-surface-500">
            <div>
              <span className="font-bold text-surface-800 dark:text-white">{referrals.length}</span> Friends Invited
            </div>
            <div>
              <span className="font-bold text-surface-800 dark:text-white">
                ₹{referrals.reduce((acc, curr) => acc + Number(curr.rewardAmount), 0)}
              </span>{' '}
              Total Earned
            </div>
          </div>
        </Card>

        {/* Apply code widget */}
        <Card className="space-y-4">
          <h3 className="font-bold text-lg text-surface-900 dark:text-white">Been Referred?</h3>
          <p className="text-xs text-surface-500 leading-relaxed">
            If you signed up via a friend's recommendation, enter their code here to activate bonuses.
          </p>

          <form onSubmit={handleApplyCode} className="space-y-3">
            <Input
              placeholder="e.g. A3B2C9X4"
              value={refCodeInput}
              onChange={(e) => setRefCodeInput(e.target.value)}
              disabled={applyMutation.isPending}
            />
            <Button
              type="submit"
              fullWidth
              size="sm"
              isLoading={applyMutation.isPending}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Apply Referral
            </Button>
          </form>
        </Card>
      </div>

      {/* Referrals table */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Invited Friends List</h3>

        <Card padding="none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Friend</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rewards Earned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  icon={<Users className="w-8 h-8" />}
                  title="No referrals yet"
                  description="Your referral list is empty. Start sharing your referral link!"
                />
              ) : (
                referrals.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-semibold text-surface-900 dark:text-white">
                      {ref.referred?.firstName} {ref.referred?.lastName}
                    </TableCell>
                    <TableCell>{ref.referred?.email}</TableCell>
                    <TableCell className="font-semibold text-success-600">
                      ₹{ref.rewardAmount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ref.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {ref.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-surface-400">
                      {format(new Date(ref.createdAt), 'PP')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};
