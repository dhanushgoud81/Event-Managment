import React from 'react';
import { useWallet } from '@/hooks/useReferrals';
import { PageLoader } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export const WalletPage: React.FC = () => {
  const { data, isLoading } = useWallet();

  if (isLoading) return <PageLoader message="Loading wallet..." />;

  const wallet = data?.data;
  const balance = wallet?.balance ? Number(wallet.balance) : 0;
  const transactions = wallet?.transactions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Wallet</h1>
        <p className="text-surface-500">Track your referral reward credits and wallet transactions.</p>
      </div>

      {/* Balance Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-500/20">
          <div className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase tracking-wider">Available Balance</p>
            <p className="text-3xl font-black text-primary-600 dark:text-primary-400 mt-1">₹{balance}</p>
          </div>
        </Card>
      </div>

      {/* Transactions list */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Transaction Logs</h3>

        <Card padding="none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance After</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  icon={<DollarSign className="w-8 h-8" />}
                  title="No transactions yet"
                  description="Refer friends to earn credits in your wallet."
                />
              ) : (
                transactions.map((tx) => {
                  const isCredit = tx.type === 'CREDIT';

                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-semibold">
                          {isCredit ? (
                            <TrendingUp className="w-4 h-4 text-success-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-danger-500" />
                          )}
                          <span className={isCredit ? 'text-success-600' : 'text-danger-600'}>
                            {tx.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className={`font-bold ${isCredit ? 'text-success-600' : 'text-danger-600'}`}>
                        {isCredit ? '+' : '-'}₹{tx.amount}
                      </TableCell>
                      <TableCell>₹{tx.balanceAfter}</TableCell>
                      <TableCell className="text-xs text-surface-400">
                        {format(new Date(tx.createdAt), 'PPp')}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};
