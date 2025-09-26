'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Wallet, ArrowRight, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DONATION_DAO_ADDRESS, BASESCAN_BASE_URL } from '@/lib/contract-config';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';
import { useOnchainStore } from '@/lib/store';
import { donateToFund, getDonorFlags } from '@/lib/contract';
import { useDonates, useDonatesByDonor } from '@/hooks/useApi';

export default function DonatePage() {
  return (
      <DonatePageContent />
  );
}

function DonatePageContent() {
  const { isLoading, isLoaded, fundBalance, refresh } = useOnchainStore();
  useEffect(() => {
    if (!isLoaded && !isLoading) refresh();
  }, [isLoaded, isLoading, refresh]);
  const [donationAmount, setDonationAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'yours'>('all');
  const [donorInfo, setDonorInfo] = useState<{ isDonor: boolean; hasSbt: boolean; totalFundDonated: string } | null>(null)
  const [localHistory, setLocalHistory] = useState<Array<{ txHash: string; amount: string; from?: string; timestamp: number }>>([]);
  const { isConnected, connectWallet, address } = useWallet();
  useEffect(() => {
    (async () => {
      if (address) {
        try {
          const flags = await getDonorFlags(address)
          setDonorInfo(flags)
        } catch {
          setDonorInfo(null)
        }
      } else {
        setDonorInfo(null)
      }
    })()
  }, [address])
  
  // Get donations from API
  const { data: allDonations, isLoading: allDonationsLoading } = useDonates();
  const { data: userDonations, isLoading: userDonationsLoading } = useDonatesByDonor(address || '');

  const quickAmounts = [10, 50, 100, 500, 1000];

  const handleDonate = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { hash } = await donateToFund(donationAmount);
      setTxHash(hash as string);
      setLocalHistory(prev => [
        { txHash: hash as string, amount: `${parseInt(donationAmount) * 1000000}`, from: address || undefined, timestamp: Date.now() },
        ...prev,
      ]);
      setShowSuccess(true);
      if (address) {
        try {
          const flags = await getDonorFlags(address)
          setDonorInfo(flags)
        } catch {}
      }
    } finally {
      setIsSubmitting(false);
    }
    // Do not auto-close; wait for user to close
  };

  const handleQuickAmount = (amount: number) => {
    setDonationAmount(amount.toString());
  };

  return (
    <div className="min-h-screen pt-8 pb-16 bg-[hsl(var(--background))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {isConnected && (
          <div className="mb-4">
            <Card className="bg-card border border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {donorInfo?.hasSbt ? (
                    <Badge className="bg-primary/10 text-primary border-border">Donor SBT</Badge>
                  ) : (
                    <Badge variant="outline" className="border-border">No SBT yet</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {donorInfo?.isDonor ? 'Thanks for being a donor!' : 'Donate to become a recognized donor (SBT)'}
                  </span>
                </div>
                {donorInfo?.totalFundDonated && (
                  <div className="text-sm">
                    Total Donated: <span className="font-semibold">${Number(donorInfo.totalFundDonated).toFixed(2)} USDT</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-4 bg-transparent text-primary border-border">
            💝 Community Fund
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Donate to Community Fund
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your contribution goes to our community fund managed by DAO members. 
            Funds are distributed transparently to verified charity projects and emergency aid requests.
          </p>
        </motion.div>

        {/* Banner for Project Donations */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Want to support specific projects?
                    </h3>
                    <p className="text-muted-foreground">
                      Donate requestly to crowdfunding campaigns and see your impact in real-time
                    </p>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href="/projects/crowdfunding" className="text-sm px-8 py-4">
                    Browse Projects
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donation Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Make a Donation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {showSuccess ? (
                  <motion.div
                    className="text-center py-8"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-primary mb-2">
                      Donation Successful!
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Thank you for your generous contribution of ${donationAmount} USDT
                    </p>
                    <div className="flex flex-col items-center gap-3">
                      <Badge variant="success">Transaction confirmed on blockchain</Badge>
                      {txHash && (
                        <Link href={`${BASESCAN_BASE_URL}/tx/${txHash}`} target="_blank" className="text-primary hover:underline text-sm">
                          View transaction on BaseScan
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSuccess(false);
                          setDonationAmount('');
                          setTxHash(null);
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Amount Input */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Donation Amount (USDT)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="pl-10 text-sm"
                          min="1"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Quick Select
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {quickAmounts.map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAmount(amount)}
                            className={`${
                              donationAmount === amount.toString() 
                                ? 'bg-primary/10 border-primary' 
                                : ''
                            }`}
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Impact Preview */}
                    {donationAmount && parseFloat(donationAmount) > 0 && (
                      <motion.div
                        className="bg-accent p-4 rounded-lg border border-border"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="font-medium mb-2">Your Impact</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>• Could provide meals for {Math.floor(parseFloat(donationAmount) / 5)} families</p>
                          <p>• Contributes to {Math.floor(parseFloat(donationAmount) / 100)} education scholarships</p>
                          <p>• Supports {Math.floor(parseFloat(donationAmount) / 200)} medical treatments</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Donate Button */}
                <Button
                      onClick={handleDonate}
                      disabled={isSubmitting || !donationAmount || parseFloat(donationAmount) <= 0}
                      className="w-full text-sm py-4"
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : !isConnected ? (
                        <>
                          <Wallet className="mr-2 h-5 w-5" />
                          Connect Wallet to Donate
                        </>
                      ) : (
                        <>
                          <Heart className="mr-2 h-5 w-5" />
                          Donate ${donationAmount || '0'} USDT
                        </>
                      )}
                    </Button>

                    {/* Security Notice */}
                    <div className="text-xs text-muted-foreground text-center space-y-1">
                      <p>🔒 All transactions are secured by blockchain technology</p>
                      <p>🔍 100% transparent - track your donation in real-time</p>
                      <p>✅ Verified by DAO community governance</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

          {/* Donation History under the form */}
          <Card className="mt-6 bg-card border border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Donation History</span>
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeTab === 'yours' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('yours')}
                  >
                    Yours
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(activeTab === 'all' ? allDonationsLoading : userDonationsLoading) ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading donations...</p>
                </div>
              ) : activeTab === 'yours' && !isConnected ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3">Connect your wallet to view your donations</p>
                  <Button onClick={connectWallet}>
                    <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2">Time</th>
                        <th className="py-2">Donor</th>
                        <th className="py-2">Amount (USDT)</th>
                        <th className="py-2">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Get the appropriate API data based on active tab
                        const apiData = activeTab === 'yours' ? userDonations : allDonations;
                        
                        // Combine API donations with local history
                        const combinedDonations = [
                          ...localHistory.map(h => ({
                            _id: h.txHash,
                            donor_wallet: h.from || '',
                            amount: h.amount,
                            project_id: 'community-fund',
                            tx_hash: h.txHash,
                            createdAt: new Date(h.timestamp).toISOString(),
                            updatedAt: new Date(h.timestamp).toISOString(),
                            donateType: 'direct'
                          })),
                          ...(Array.isArray(apiData) ? apiData : [])
                        ];
                        
                        // For "yours" tab, filter local history to match current user
                        let filteredDonations = combinedDonations;
                        if (activeTab === 'yours') {
                          filteredDonations = combinedDonations.filter(donation => {
                            // API data is already filtered by backend, only filter local history
                            if (donation.tx_hash && localHistory.some(h => h.txHash === donation.tx_hash)) {
                              return address && donation.donor_wallet.toLowerCase() === address.toLowerCase();
                            }
                            return true; // Keep API data as is
                          });
                        }
                        
                        // Sort by date (newest first) and take first 20
                        const sortedDonations = filteredDonations
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 20);
                          
                        return sortedDonations.map((donation, i) => (
                          <tr key={`${donation._id}-${i}`} className="border-t border-border">
                            <td className="py-2 text-muted-foreground">
                              {new Date(donation.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2 font-mono text-xs">
                              {donation.donor_wallet ? 
                                `${donation.donor_wallet.slice(0, 6)}...${donation.donor_wallet.slice(-4)}` : 
                                'Unknown'
                              }
                            </td>
                            <td className="py-2 font-medium">
                              ${(parseFloat(donation.amount) / 1000000).toFixed(2)}
                            </td>
                            <td className="py-2 text-xs">
                              {donation.tx_hash ? (
                                <Link 
                                  href={`${BASESCAN_BASE_URL}/tx/${donation.tx_hash}`} 
                                  target="_blank" 
                                  className="text-primary hover:underline font-mono"
                                >
                                  {donation.tx_hash.slice(0, 8)}...{donation.tx_hash.slice(-6)}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">No hash</span>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                      {(() => {
                        const apiData = activeTab === 'yours' ? userDonations : allDonations;
                        const hasApiData = apiData && apiData.length > 0;
                        const hasLocalData = localHistory.length > 0;
                        
                        if (!hasApiData && !hasLocalData) {
                          return (
                            <tr>
                              <td className="py-6 text-center text-muted-foreground" colSpan={4}>
                                {activeTab === 'yours' ? 'No donations from your wallet found' : 'No donations found'}
                              </td>
                            </tr>
                          );
                        }
                        return null;
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>

          {/* Fund Statistics */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Current Fund Stats */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Fund Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1">
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {isLoading && !isLoaded ? 'Loading...' : `$${fundBalance}`} USDT
                    </div>
                    <div className="text-sm text-muted-foreground">Total Available</div>
                  </div>
                </div>
                
              </CardContent>
            </Card>

            {/* How Donations Work */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle>How Your Donation Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Secure Transaction",
                    description: "Your donation is processed through secure blockchain technology",
                    icon: "🔒"
                  },
                  {
                    step: 2,
                    title: "DAO Review",
                    description: "Requests are reviewed and voted on by our trusted DAO members",
                    icon: "👥"
                  },
                  {
                    step: 3,
                    title: "Request Distribution",
                    description: "Approved funds go requestly to beneficiaries with full transparency",
                    icon: "💸"
                  },
                  {
                    step: 4,
                    title: "Real-time Tracking",
                    description: "Track your donation impact with blockchain transparency",
                    icon: "📊"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-accent">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center">
                        <span className="mr-2">{item.icon}</span>
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-card border border-border">
              <CardContent className="p-6 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Every Dollar Counts</h3>
                <p className="mb-4 text-muted-foreground">
                  Join thousands of donors making a real difference in communities worldwide
                </p>
                <Button
                  onClick={() => document.querySelector('input')?.focus()}
                >
                  Start Donating Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {/* Explorer link for transparency */}
                <div className="text-center">
                  <Link href={`${BASESCAN_BASE_URL}/address/${DONATION_DAO_ADDRESS}`} target="_blank" className="text-sm text-primary hover:underline">
                    View Contract on BaseScan
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
