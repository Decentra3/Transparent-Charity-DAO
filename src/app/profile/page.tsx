'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Shield,
  TrendingUp,
  DollarSign,
  Edit3,
  CheckCircle,
  Clock,
  Award,
  Activity,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RouteProtection } from '@/components/RouteProtection';
import { useWallet } from '@/hooks/useWallet';
import { useOnchainStore } from '@/lib/store';
import { formatAddress, formatUSDT } from '@/lib/utils';
import { useUser, useTransactionsByAddress, useUpdateUser } from '@/hooks/useApi';
import Link from 'next/link';
import { DONATION_DAO_ADDRESS, BASESCAN_BASE_URL } from '@/lib/contract';

function ProfilePageContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    email: ''
  });
  const { address, isConnected } = useWallet();
  const { isDaoMember, user, setUser } = useOnchainStore();

  // Fetch user data from API
  const { data: apiUser, isLoading: userLoading } = useUser(address || '');

  // Fetch user transactions from API
  const { data: userTransactions, isLoading: transactionsLoading } = useTransactionsByAddress(address || '');

  // Update user mutation
  const updateUserMutation = useUpdateUser();


  // Clear user data when wallet disconnects
  useEffect(() => {
    if (!isConnected || !address) {
      setUser(null);
      setProfileData({
        username: '',
        email: ''
      });
    }
  }, [isConnected, address, setUser]);

  // Sync API user data to global state
  useEffect(() => {
    if (apiUser && isConnected && address) {
      // Always update if we have new API data and wallet is connected
      if (!user || user.wallet_address !== address) {
        setUser(apiUser);
        setProfileData({
          username: apiUser.username || '',
          email: apiUser.email || ''
        });
      }
    }
  }, [apiUser, user, setUser, isConnected, address]);


  // Reset success message after 3 seconds
  useEffect(() => {
    if (updateUserMutation.isSuccess) {
      const timer = setTimeout(() => {
        updateUserMutation.reset();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [updateUserMutation.isSuccess, updateUserMutation]);

  const handleSaveProfile = async () => {
    if (!user?._id) return;

    try {
      await updateUserMutation.mutateAsync({
        id: user._id,
        updates: {
          username: profileData.username,
          email: profileData.email
        }
      });
      
      // Update local user state
      setUser({
        ...user,
        username: profileData.username,
        email: profileData.email
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Keep editing mode open on error
    }
  };


  if (!isConnected || !address) return null;

  // Show loading when fetching user data or during KYC sync
  if (userLoading || (isConnected && address && !user && !apiUser)) {
    return (
      <div className="min-h-screen pt-8 pb-16 bg-[hsl(var(--background))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="text-lg text-muted-foreground">
              {userLoading ? 'Loading profile...' : 'Syncing wallet data...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getKycStatusColor = (isKYC: boolean) => {
    return isKYC ? 'default' : 'secondary';
  };

  const getKycStatusIcon = (isKYC: boolean) => {
    return isKYC ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const getKycStatusText = (isKYC: boolean) => {
    return isKYC ? 'Verified' : 'Pending';
  };

  const getTransactionStatusIcon = (eventType: string) => {
    switch (eventType) {
      case 'donate':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'vote':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'request':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

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



  return (
    <div className="min-h-screen pt-8 pb-16 bg-[hsl(var(--background))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                My Profile
              </h1>
              <p className="text-lg text-muted-foreground hidden md:block">
                Manage your account information and view your activity
              </p>
            </div>
            {isDaoMember && (
              <Badge className="bg-transparent text-primary border-border px-4 py-2">
                <Award className="h-4 w-4 mr-2" />
                DAO Member
              </Badge>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Basic Info Card */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-primary" />
                    <span>Basic Information</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isEditing ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Username
                    </label>
                    {isEditing ? (
                      <Input
                        value={profileData.username}
                        onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      />
                    ) : (
                      <div className="p-3 bg-accent rounded-lg font-medium">
                        {profileData.username || 'Not set'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    ) : (
                      <div className="p-3 bg-accent rounded-lg font-medium">
                        {profileData.email || 'Not set'}
                      </div>
                    )}
                  </div>
                </div>

                {updateUserMutation.isError && (
                  <div className="p-3 bg-red-500/10 text-red-700 border border-red-500/20 hover:bg-red-500/15 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20">
                    <div className="flex items-center text-sm text-red-700 dark:text-red-400">
                      <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Failed to update profile. Please try again.</span>
                    </div>
                  </div>
                )}

                {updateUserMutation.isSuccess && !isEditing && (
                  <div className="p-3 bg-green-500/10 text-green-700 border border-green-500/20 hover:bg-green-500/15 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/20">
                    <div className="flex items-center text-sm text-green-700 dark:text-green-400">
                      <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Profile updated successfully!</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Wallet Address
                  </label>
                  <div className="p-3 bg-accent rounded-lg font-mono text-muted-foreground break-all">
                    {address}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Member Since
                    </label>
                    <div className="p-3 bg-accent rounded-lg flex items-center">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      KYC Status
                    </label>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={user?.isKYC ? "default" : "secondary"}
                        className={`${user?.isKYC
                          ? 'bg-green-500/10 text-green-700 border border-green-500/20 hover:bg-green-500/15 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/20'
                          : 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 hover:bg-yellow-500/15 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20'
                          } flex items-center px-3 py-1.5 text-sm font-medium rounded-full`}
                      >
                        {getKycStatusIcon(user?.isKYC || false)}
                        <span className="ml-2">{getKycStatusText(user?.isKYC || false)}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DAO Member Stats: omitted until real backend data available */}

            {/* Recent Activity */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading recent transactions...</div>
                ) : userTransactions && userTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {userTransactions.slice(0, 5).map((tx: any) => (
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
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Account Summary */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-accent rounded-lg">
                  <User className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-medium">{formatAddress(address)}</div>
                  <div className="text-sm text-muted-foreground capitalize">{isDaoMember ? 'dao member' : 'user'}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account Status:</span>
                    <Badge variant={user?.status === 'active' ? 'success' : 'destructive'}>
                      {user?.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">KYC Status:</span>
                    <Badge
                      variant={user?.isKYC ? "default" : "secondary"}
                      className={`${user?.isKYC
                        ? 'bg-green-500/10 text-green-700 border border-green-500/20 hover:bg-green-500/15 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/20'
                        : 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 hover:bg-yellow-500/15 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20'
                        } flex items-center px-2 py-1 text-xs font-medium rounded-full`}
                    >
                      {getKycStatusIcon(user?.isKYC || false)}
                      <span className="ml-1">{getKycStatusText(user?.isKYC || false)}</span>
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => window.location.href = '/donate'}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Make a Donation
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => window.location.href = '/request'}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Request Help
                </Button>
                {isDaoMember && (
                  <Button
                    className="w-full justify-start"
                    variant="ghost"
                    onClick={() => window.location.href = '/vote'}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Review Requests
                  </Button>
                )}
                <Button
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="bg-card border border-border">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Security Reminder</h4>
                    <p className="text-sm text-muted-foreground">
                      Never share your private keys or wallet seed phrase.
                      Always verify transaction details before confirming.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RouteProtection requiredRole="user">
      <ProfilePageContent />
    </RouteProtection>
  );
}
