'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, TrendingUp, Activity, Clock, CheckCircle, Vote } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DONATION_DAO_ADDRESS, BASESCAN_BASE_URL } from '@/lib/contract';
import { formatUSDT, formatAddress } from '@/lib/utils';
import { useOnchainStore } from '@/lib/store';
import { getDashboardStats } from '@/lib/contract';

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

          {/* Recent Activity - placeholder with BaseScan link */}
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
                  className="text-sm text-primary hover:underline"
                >
                  View on BaseScan
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 text-center text-muted-foreground">No recent activity displayed. Use BaseScan to explore transactions.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
