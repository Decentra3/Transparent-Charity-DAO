'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, TrendingUp, Activity, Clock, CheckCircle, Vote, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DONATION_DAO_ADDRESS, BASESCAN_BASE_URL } from '@/lib/contract-config';
import { formatUSDT, formatAddress } from '@/lib/utils';
import { useOnchainStore } from '@/lib/store';
import { getDashboardStats } from '@/lib/contract';
import { useTransactions } from '@/hooks/useApi';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
    case 'disbursed':
    case 'confirmed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'voting':
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'approved':
    case 'disbursed':
    case 'confirmed':
      return 'default';
    case 'voting':
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function Dashboard() {
  return (
      <DashboardContent />
  );
}

function DashboardContent() {
  const { isLoading, isLoaded, refresh } = useOnchainStore();
  const [stats, setStats] = useState<{ fund: string; disbursed: string; projectsVoting: number; allProjects: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Get recent transactions
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(10);
  
  useEffect(() => {
    if (!isLoaded && !isLoading) refresh();
  }, [isLoaded, isLoading, refresh]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingStats(true);
        const res = await getDashboardStats();
        setStats(res);
      } catch (e) {
        console.error('Failed to load dashboard stats', e);
      } finally {
        setLoadingStats(false);
      }
    })();
  }, []);
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor fund allocation, project progress, and transparency metrics
          </p>
        </div>

        {/* Overview Content */}
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {loadingStats ? 'Loading...' : `$${stats?.fund ?? '0.00'}`}
                </div>
                <p className="text-sm text-muted-foreground">Total Fund Available</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {loadingStats ? '...' : `$${stats?.disbursed ?? '0.00'}`}
                </div>
                <p className="text-sm text-muted-foreground">Total Disbursed</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Vote className="h-8 w-8 text-primary" />
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {loadingStats ? '...' : stats?.projectsVoting ?? 0}
                </div>
                <p className="text-sm text-muted-foreground">Projects In Voting</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-8 w-8 text-primary" />
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {loadingStats ? '...' : stats?.allProjects ?? 0}
                </div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </div>
                <Link
                  href={`${BASESCAN_BASE_URL}/address/${DONATION_DAO_ADDRESS}`}
                  target="_blank"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View on BaseScan
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="p-6 text-center text-muted-foreground">Loading recent transactions...</div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx: any) => (
                    <div key={tx._id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon('confirmed')}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {formatAddress(tx.from_address)} → {formatAddress(tx.to_address)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {tx.event_type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {tx.event_type} • {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Link
                          href={`${BASESCAN_BASE_URL}/tx/${tx.tx_hash}`}
                          target="_blank"
                          className="text-xs text-primary hover:underline flex items-center gap-1 justify-end mt-1"
                        >
                          View TX
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  No recent transactions found. Use BaseScan to explore more transactions.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
