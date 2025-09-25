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
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RouteProtection } from '@/components/RouteProtection';
import { useWallet } from '@/hooks/useWallet';
import { useOnchainStore } from '@/lib/store';
import { formatAddress, formatUSDT } from '@/lib/utils';
import { useUser } from '@/hooks/useApi';

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
  
  // Sync API user data to global state
  useEffect(() => {
    if (apiUser && !user) {
      setUser(apiUser);
      setProfileData({
        username: apiUser.username || '',
        email: apiUser.email || ''
      });
    }
  }, [apiUser, user, setUser]);

  useEffect(() => {
    // no-op: profile fields are empty by default
  }, []);

  const handleSaveProfile = () => {
    // Simulate saving profile
    setIsEditing(false);
  };

  const userTransactions: any[] = [];

  if (!isConnected || !address) return null;
  
  if (userLoading) {
    return (
      <div className="min-h-screen pt-8 pb-16 bg-[hsl(var(--background))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="text-lg text-muted-foreground">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  const getKycStatusColor = (isKYC: boolean) => {
    return isKYC ? 'success' : 'warning';
  };

  const getKycStatusIcon = (isKYC: boolean) => {
    return isKYC ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const getKycStatusText = (isKYC: boolean) => {
    return isKYC ? 'verified' : 'pending';
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
                  >
                    {isEditing ? (
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
                    <div className="flex items-center">
                      <Badge variant={getKycStatusColor(user?.isKYC || false)}>
                        {getKycStatusIcon(user?.isKYC || false)}
                        <span className="ml-2 capitalize">{getKycStatusText(user?.isKYC || false)}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DAO Member Stats: omitted until real backend data available */}

            {/* Recent Activity */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-8 rounded-full ${
                            transaction.type === 'donation' ? 'bg-primary' : 'bg-primary'
                          }`}></div>
                          <div>
                            <div className="font-medium capitalize">
                              {transaction.type}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            ${formatUSDT(transaction.amount)}
                          </div>
                          <Badge variant="success" className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
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
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">KYC Status:</span>
                    <Badge variant={getKycStatusColor(user?.isKYC || false)}>
                      {getKycStatusText(user?.isKYC || false)}
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
