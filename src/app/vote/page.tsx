'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Vote as VoteIcon, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Brain,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RouteProtection } from '@/components/RouteProtection';
import { useEffect, useState } from 'react';
import { getPendingVotesWithRole } from '@/lib/contract';
import { useWallet } from '@/hooks/useWallet';
import { useOnchainStore } from '@/lib/store';
import { formatUSDT, formatAddress } from '@/lib/utils';

function VotePageContent() {
  const { address, isConnected } = useWallet();
  const isDaoMember = useOnchainStore((s) => s.isDaoMember);
  const isDonor = useOnchainStore((s) => s.isDonor);
  const [pendingVotes, setPendingVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingVotes();
  }, [address, isConnected]);

  const loadPendingVotes = async () => {
    if (!address || !isConnected) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Loading pending votes for:', address);
      
      const votes = await getPendingVotesWithRole(address);
      console.log('Raw pending votes data with roles:', votes);
      
      // Transform the data to match the expected format
      const transformedVotes = votes.map((vote: any) => {
        console.log('Processing vote:', vote);
        
        // Handle timestamp safely
        const creationTimestamp = vote.creationTimestamp ? Number(vote.creationTimestamp) * 1000 : Date.now();
        const createdAt = new Date(creationTimestamp);
        
        if (isNaN(createdAt.getTime())) {
          console.warn('Invalid creation timestamp for vote:', vote.id, 'using current time');
          createdAt.setTime(Date.now());
        }
        
        return {
          id: String(vote.id),
          beneficiaryAddress: vote.creator,
          amount: Number(vote.amountOrTarget) / 1e6,
          description: vote.description || 'No description provided',
          title: vote.title || (vote.activityType === 0 ? `Request #${vote.id}` : 'Untitled Project'),
          type: vote.activityType === 0 ? 'request' : 'crowdfunding',
          createdAt: createdAt.toISOString(),
          votes: [], // Will be populated when we have voting data
          done: false, // All votes from getPendingVotesFor are pending
          canVoteAsDao: vote.canVoteAsDao,
          canVoteAsDonor: vote.canVoteAsDonor,
          userRole: vote.userRole,
        };
      });
      
      console.log('Transformed pending votes:', transformedVotes);
      setPendingVotes(transformedVotes);
    } catch (err) {
      console.error('Failed to load pending votes:', err);
      setError('Failed to load pending votes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pending votes...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || (!isDaoMember && !isDonor)) {
    return (
      <div className="min-h-screen pt-8 pb-16 bg-[hsl(var(--background))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-card border border-border">
            <CardContent className="p-12 text-center">
              <VoteIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Restricted Area</h3>
              <p className="text-muted-foreground">
                Only DAO members and donors can access the vote page.
                {!isDaoMember && !isDonor && (
                  <span className="block mt-2 text-sm">
                    Connect your wallet and become a donor by making a donation.
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
          <div className="flex items-center space-x-3 mb-4">
            <Badge className="bg-transparent text-primary border-border">
              ⚖️ {isDaoMember ? 'DAO Governance' : 'Donor Voting'}
            </Badge>
            {isDaoMember && (
              <Badge variant="outline" className="text-primary border-border">
                DAO Member
              </Badge>
            )}
            {isDonor && !isDaoMember && (
              <Badge variant="outline" className="text-primary border-border">
                Donor
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Vote on Pending Items
          </h1>
          <p className="text-lg text-muted-foreground">
            {isDaoMember 
              ? 'Review and vote on pending requests and crowdfunding projects. Your decision helps ensure transparency and fairness.'
              : 'Vote on requests that have been approved by DAO members. Your vote helps determine if approved requests should receive funding.'
            }
          </p>
          
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadPendingVotes}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}
          
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">{pendingVotes.length}</div>
                  <div className="text-sm text-muted-foreground">Pending Votes</div>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {pendingVotes.reduce((sum, vote) => sum + (vote.votes?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Votes Cast</div>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    ${formatUSDT(pendingVotes.reduce((sum, vote) => sum + vote.amount, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Pending</div>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Requests List */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {pendingVotes.length === 0 ? (
            <Card className="bg-card border border-border">
              <CardContent className="p-12 text-center">
                <VoteIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending Votes</h3>
                  <p className="text-muted-foreground">All items have been voted on. Check back later for new requests or projects.</p>
              </CardContent>
            </Card>
          ) : (
            pendingVotes.map((vote: any) => (
              <Card key={`${vote.id}-${vote.type}`} className="hover:shadow-lg transition-shadow bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-8 bg-primary rounded-full"></div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {vote.title || (vote.type === 'request' ? `Request #${vote.id}` : `Project #${vote.id}`)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          From {formatAddress(vote.beneficiaryAddress)}
                          {vote.type === 'crowdfunding' && (
                            <span className="ml-2 text-primary font-medium">(Crowdfunding)</span>
                          )}
                          {vote.canVoteAsDao && (
                            <span className="ml-2 text-blue-500 font-medium">(DAO Vote)</span>
                          )}
                          {vote.canVoteAsDonor && !vote.canVoteAsDao && (
                            <span className="ml-2 text-green-500 font-medium">(Donor Vote)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${formatUSDT(vote.amount)}
                      </div>
                      <Badge variant="outline" className="text-primary border-border">voting</Badge>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {vote.description}
                  </p>

                  {vote.aiAnalysis && (
                    <div className="flex items-center space-x-4 mb-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Brain className="h-4 w-4 text-primary" />
                        <span>AI Risk: </span>
                        <span className={`font-medium ${
                          vote.aiAnalysis.fraudScore < 30 ? 'text-primary' :
                          vote.aiAnalysis.fraudScore < 70 ? 'text-yellow-500' : 'text-destructive'
                        }`}>
                          {vote.aiAnalysis.fraudScore}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span>Recommendation: </span>
                        <span className="font-medium capitalize">{vote.aiAnalysis.recommendation}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(vote.createdAt).toLocaleDateString()}</span>
                      </div>
                      {/* votes not available from view; can compute from approve/reject counts if desired */}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={vote.type === 'request' ? `/projects/requests/${vote.id}` : `/projects/crowdfunding/${vote.id}`}>
                        <Button>
                          <VoteIcon className="h-4 w-4 mr-2" />
                          Review & Vote
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function VotePage() {
  return (
    <RouteProtection requireConnection={true}>
      <VotePageContent />
    </RouteProtection>
  );
}
