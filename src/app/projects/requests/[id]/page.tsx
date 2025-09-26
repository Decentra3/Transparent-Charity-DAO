'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, Vote, ExternalLink, FileText, User, Calendar, DollarSign, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { DONATION_DAO_ADDRESS, BASESCAN_BASE_URL } from '@/lib/contract-config';
import { getRequestById, getDaoMemberCount, isDaoMemberAddress, donorVoteOnRequest, finalizeRequestByDonors, closeApprovedRequest } from '@/lib/contract';
import { RouteProtection } from '@/components/RouteProtection';
import { useWallet } from '@/hooks/useWallet';
import { useOnchainStore } from '@/lib/store';
import { formatUSDT, formatAddress } from '@/lib/utils';
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions';
import { config } from '@/config';
import { DonationDAOAbi } from '@/lib/abi/DonationDAO';
import { getIPFSUrl, getFileType, formatIPFSHash } from '@/lib/ipfs';
import { getAIAnalysisResult, type AIAnalysisResponse } from '@/lib/api/ai-analysis';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
    case 'disbursed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'waiting_claim':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'donor_voting':
      return <Vote className="h-4 w-4 text-yellow-500" />;
    case 'voting':
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'rejected':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'approved':
    case 'disbursed':
      return 'default';
    case 'waiting_claim':
      return 'secondary';
    case 'donor_voting':
      return 'secondary';
    case 'voting':
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'donor_voting':
      return 'Donor Voting';
    case 'waiting_claim':
      return 'Waiting Claim';
    case 'voting':
      return 'Voting';
    case 'disbursed':
      return 'Disbursed';
    case 'rejected':
      return 'Rejected';
    case 'approved':
      return 'Approved';
    case 'closed':
      return 'Closed';
    case 'pending':
      return 'Pending';
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  }
};

// Mock AI Analysis data
const getMockAIAnalysis = () => ({
  fraudScore: Math.floor(Math.random() * 100),
  recommendation: Math.random() > 0.5 ? 'approve' : 'reject',
  confidence: Math.floor(Math.random() * 40) + 60,
  riskFactors: ['Low documentation', 'High amount request', 'New user'],
  positiveFactors: ['Clear description', 'Reasonable amount', 'Good history']
});

export default function RequestFundDetailPage() {
  return (
    <RouteProtection>
      <RequestFundDetailContent />
    </RouteProtection>
  );
}

function RequestFundDetailContent() {
  const params = useParams();
  const { isConnected, address } = useWallet();
  const { showToast } = useToast();
  const { isLoading, isLoaded, activities, refresh } = useOnchainStore();
  const [request, setRequest] = useState<{
    id: string;
    beneficiaryAddress: string;
    amount: number;
    description: string;
    proofHash: string;
    createdAt: string;
    status: string;
    aiAnalysis: {
      fraudScore: number;
      recommendation: string;
      confidence: number;
      riskFactors: string[];
      positiveFactors: string[];
    };
    quorumPercent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voteProgress, setVoteProgress] = useState({ approve: 0, reject: 0, total: 0 });
  const [donorPhase, setDonorPhase] = useState<{ active: boolean; deadline?: number; approve?: number; reject?: number } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded && !isLoading) refresh();
  }, [isLoaded, isLoading, refresh]);

  useEffect(() => {
    (async () => {
      if (activities.length > 0 && params.id) {
        const idStr = String(params.id)
        // eslint-disable-next-line no-console
        console.log('[RequestDetail] params.id =', idStr)

        const foundRequest = activities.find((activity: { activityType: number; id: string | number; creator?: string; description?: string; creationTimestamp?: number }) => 
          activity.activityType === 0 && String(activity.id) === idStr
        );

        // eslint-disable-next-line no-console
        console.log('[RequestDetail] activity found =', foundRequest)

        try {
          const [onchain, memberCount] = await Promise.all([
            getRequestById(idStr),
            getDaoMemberCount(),
          ])

          // eslint-disable-next-line no-console
          console.log('[RequestDetail] getRequestById result =', onchain)
          // eslint-disable-next-line no-console
          console.log('[RequestDetail] daoMemberCount =', memberCount)

          setVoteProgress({
            approve: Number(onchain.approveCount ?? BigInt(0)),
            reject: Number(onchain.rejectCount ?? BigInt(0)),
            total: Number(memberCount ?? BigInt(0)),
          })

          setRequest({
            id: idStr,
            beneficiaryAddress: (onchain.beneficiary as string) || (foundRequest?.creator as string) || '',
            amount: Number(onchain.amount ?? BigInt(0)) / 1e6,
            description: (onchain.description as string) || (foundRequest?.description as string) || '',
            proofHash: (onchain.proofHash as string) || '',
            createdAt: new Date(Number(foundRequest?.creationTimestamp || 0) * 1000).toISOString(),
            status: onchain.done
              ? (onchain.paid ? 'disbursed' : 'rejected')
              : onchain.daoDecisionMade
                ? (onchain.daoApproved 
                    ? (onchain.donorVoteDeadline > 0 && Date.now() / 1000 > Number(onchain.donorVoteDeadline)
                        ? (Number(onchain.donorApproveCount) >= (Number(onchain.donorApproveCount) + Number(onchain.donorRejectCount)) * Number(onchain.quorumPercent) / 100
                            ? 'waiting_claim' 
                            : 'rejected')
                        : 'donor_voting')
                    : 'rejected')
                : 'voting',
            aiAnalysis: getMockAIAnalysis(), // Will be updated when AI analysis loads
            quorumPercent: Number(onchain.quorumPercent ?? 50),
          });

          // Load AI analysis
          setAiLoading(true);
          try {
            const aiResult = await getAIAnalysisResult(idStr);
            setAiAnalysis(aiResult);
            // Update request with real AI analysis
            setRequest(prev => prev ? {
              ...prev,
              aiAnalysis: {
                fraudScore: aiResult.data.fraud_score,
                recommendation: aiResult.data.recommendation,
                confidence: 100 - aiResult.data.fraud_score,
                riskFactors: aiResult.data.key_reasons,
                positiveFactors: [],
              }
            } : prev);
          } catch (error) {
            console.warn('Failed to load AI analysis:', error);
            setAiAnalysis(null);
          } finally {
            setAiLoading(false);
          }

          // Donor vote phase detection via extra reader (extend ABI if needed). Here we infer from contract state via store not available.
          // Fallback: Try reading fields if present on "onchain" (depends on viem decoding). Use optional chaining safely.
          const dvDeadline = Number((onchain as { donorVoteDeadline?: bigint })?.donorVoteDeadline || 0)
          const dvApprove = Number((onchain as { donorApproveCount?: bigint })?.donorApproveCount || 0)
          const dvReject = Number((onchain as { donorRejectCount?: bigint })?.donorRejectCount || 0)
          if (dvDeadline && dvDeadline > 0 && !onchain.done && onchain.daoDecisionMade && onchain.daoApproved) {
            setDonorPhase({ active: Date.now() / 1000 <= dvDeadline, deadline: dvDeadline, approve: dvApprove, reject: dvReject })
          } else {
            setDonorPhase(null)
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[RequestDetail] error fetching onchain detail:', err)
        } finally {
          setLoading(false)
        }
      }
    })()
  }, [activities, params.id]);


  const [isDAOMember, setIsDAOMember] = useState(false);

  useEffect(() => {
    (async () => {
      if (address) {
        const result = await isDaoMemberAddress(address as string)
        setIsDAOMember(result)
        // eslint-disable-next-line no-console
        console.log('[RequestDetail] isDAOMember =', result, 'for', address)
      } else {
        setIsDAOMember(false)
      }
    })()
  }, [address])

  const handleVote = async (decision: boolean) => {
    if (!request || !isConnected || !isDAOMember) return;
    
    try {
      setVoting(true);
      const hash = await writeContract(config, {
        abi: DonationDAOAbi,
        address: DONATION_DAO_ADDRESS as `0x${string}`,
        functionName: 'vote',
        args: [request.id, decision],
      });
      
      await waitForTransactionReceipt(config, { hash });
      
      // Refresh data after successful vote
      await refresh();
      
      // Update local vote progress
      setVoteProgress(prev => ({
        ...prev,
        approve: decision ? prev.approve + 1 : prev.approve,
        reject: !decision ? prev.reject + 1 : prev.reject,
      }));
      
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Vote failed. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const [donorVoting, setDonorVoting] = useState(false)
  const handleDonorVote = async (decision: boolean) => {
    if (!request || !isConnected) return;
    try {
      setDonorVoting(true)
      await donorVoteOnRequest(request.id, decision)
      await refresh()
    } catch (e) {
      console.error('Donor vote failed:', e)
      alert('Donor vote failed. Try again.')
    } finally {
      setDonorVoting(false)
    }
  }

  const handleFinalize = async () => {
    if (!request || !isConnected) return;
    try {
      setDonorVoting(true)
      await finalizeRequestByDonors(request.id)
      await refresh()
    } catch (e) {
      console.error('Finalize failed:', e)
      alert('Finalize failed. Try again.')
    } finally {
      setDonorVoting(false)
    }
  }

  const handleClaim = async () => {
    if (!request || !isConnected) return;
    try {
      setDonorVoting(true)
      await closeApprovedRequest(request.id)
      await refresh()
    } catch (e) {
      console.error('Claim failed:', e)
      alert('Claim failed. Try again.')
    } finally {
      setDonorVoting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested request fund could not be found.</p>
          <Link href="/projects/requests">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="container mx-auto px-6 py-8">
        {/* Debug */}
        <pre className="text-xs text-gray-400 whitespace-pre-wrap" style={{ display: 'none' }}>
          {JSON.stringify({ request }, null, 2)}
        </pre>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/projects/requests">
              <Button variant="outline" className="">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = typeof window !== 'undefined' ? `${window.location.origin}/projects/requests/${request.id}` : '';
                if (!url) return;
                if (navigator.share) {
                  navigator.share({ title: `Request Fund`, url }).catch(() => {
                    navigator.clipboard.writeText(url);
                    showToast({ variant: 'success', title: 'Link copied', description: 'Share URL copied to clipboard' });
                  });
                } else {
                  navigator.clipboard.writeText(url);
                  showToast({ variant: 'success', title: 'Link copied', description: 'Share URL copied to clipboard' });
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </div>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-2 h-8 bg-primary rounded-full"></div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-3xl font-bold">
                  Request Fund
                </h1>
                <Badge variant="outline" className="bg-transparent text-primary border-border">
                  Request Fund
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Request for assistance from the community fund
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>Request Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Requester</p>
                      <p className="font-medium">{formatAddress(request.beneficiaryAddress)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-accent p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Requested Amount</span>
                    <span className="text-2xl font-bold text-primary">
                      ${formatUSDT(request.amount)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
                  <p className="text-muted-foreground leading-relaxed bg-accent p-4 rounded-lg">
                    {request.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Evidence/Proof Files */}
            {request.proofHash && (
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Supporting Evidence</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* File Preview */}
                    {getFileType(request.proofHash) === 'image' ? (
                      <div className="space-y-2">
                        <img
                          src={getIPFSUrl(request.proofHash)}
                          alt="Evidence"
                          className="w-full max-w-md rounded-lg border border-border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          IPFS Hash: {formatIPFSHash(request.proofHash)}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 md:gap-0 md:flex-row items-center space-x-4 p-4 bg-accent rounded-lg">
                        <FileText className="h-8 w-8 text-primary hidden md:block" />
                        <div className="flex-1">
                          <p className="font-medium">Document File</p>
                          <p className="text-sm text-muted-foreground">
                            IPFS Hash: {formatIPFSHash(request.proofHash)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setPreviewUrl(getIPFSUrl(request.proofHash));
                              setIsPreviewOpen(true);
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {getIPFSUrl(request.proofHash) && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={getIPFSUrl(request.proofHash)} download>
                                Download
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DAO Voting Progress */}
            {request.status === 'voting' && (
            <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Vote className="h-5 w-5 text-primary" />
                    <span>Voting Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsUp className="h-5 w-5 text-primary" />
                        <span className="font-medium">Approve</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{voteProgress.approve}</div>
                    </div>
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsDown className="h-5 w-5 text-destructive" />
                        <span className="font-medium">Reject</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{voteProgress.reject}</div>
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    Total DAO Members: {voteProgress.total}
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    Target: {request.quorumPercent}% approve votes to pass
                  </div>
                  
                  {voteProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Approval Rate</span>
                        <span>{Math.round((voteProgress.approve / voteProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(voteProgress.approve / voteProgress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Donor Voting Progress */}
            {request.status === 'donor_voting' && donorPhase && (
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Vote className="h-5 w-5 text-primary" />
                    <span>Donor Voting</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsUp className="h-5 w-5 text-primary" />
                        <span className="font-medium">Approve</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{donorPhase.approve ?? 0}</div>
                    </div>
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsDown className="h-5 w-5 text-destructive" />
                        <span className="font-medium">Reject</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{donorPhase.reject ?? 0}</div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Target: {request.quorumPercent ?? 50}% approve votes to pass
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Deadline: {donorPhase.deadline ? new Date(donorPhase.deadline * 1000).toLocaleString() : ''}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Waiting Claim Status */}
            {request.status === 'waiting_claim' && (
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span>Approved by Donors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-sm font-medium text-orange-800 mb-1">
                      Request Approved
                    </div>
                    <div className="text-xs text-orange-600">
                      Waiting for beneficiary to claim funds
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Voting Results - Show when finalized */}
            {(request.status === 'disbursed' || request.status === 'rejected') && (
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {request.status === 'disbursed' ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <span>Voting Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsUp className="h-5 w-5 text-primary" />
                        <span className="font-medium">Approve</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{voteProgress.approve}</div>
                    </div>
                    <div className="text-center p-4 bg-accent rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsDown className="h-5 w-5 text-destructive" />
                        <span className="font-medium">Reject</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{voteProgress.reject}</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      request.status === 'disbursed' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {request.status === 'disbursed' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Request Approved by Donors & Disbursed
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Request Rejected by Donors
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(request.status)}
                  <span>Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getStatusColor(request.status)} className="text-lg px-4 py-2">
                  {formatStatus(request.status)}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  {request.status === 'voting' 
                    ? 'This request is currently under review by DAO members.'
                    : request.status === 'donor_voting'
                    ? 'This request has been approved by DAO and is now open for donor voting.'
                    : request.status === 'waiting_claim'
                    ? 'This request has been approved by donors and is waiting for the beneficiary to claim funds.'
                    : request.status === 'disbursed'
                    ? 'This request has been approved and funds have been disbursed.'
                    : request.status === 'rejected'
                    ? 'This request has been rejected by the community.'
                    : 'This request is being processed.'
                  }
                </p>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Fraud Risk Score</span>
                    <span className={`font-medium ${
                      request.aiAnalysis.fraudScore < 30 ? 'text-primary' :
                      request.aiAnalysis.fraudScore < 70 ? 'text-yellow-500' : 'text-destructive'
                    }`}>
                      {request.aiAnalysis.fraudScore}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        request.aiAnalysis.fraudScore < 30 ? 'bg-primary' :
                        request.aiAnalysis.fraudScore < 70 ? 'bg-yellow-500' : 'bg-destructive'
                      }`}
                      style={{ width: `${request.aiAnalysis.fraudScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Recommendation</span>
                    <span className={`font-medium capitalize ${
                      request.aiAnalysis.recommendation === 'approve' ? 'text-primary' : 'text-destructive'
                    }`}>
                      {request.aiAnalysis.recommendation}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Confidence: {request.aiAnalysis.confidence}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {request.status === 'voting' ? (
                  isConnected && isDAOMember ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 text-center">
                        You are a DAO member. Cast your vote:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleVote(true)}
                          disabled={voting}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleVote(false)}
                          disabled={voting}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                      {voting && (
                        <p className="text-sm text-gray-500 text-center">
                          Processing vote...
                        </p>
                      )}
                    </div>
                  ) : isConnected ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 text-center">
                        Only DAO members can vote
                      </p>
                      <Link href={`${BASESCAN_BASE_URL}/address/${DONATION_DAO_ADDRESS}`} target="_blank">
                        <Button variant="outline" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on BaseScan
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 text-center">
                        Connect wallet to vote
                      </p>
                      <Link href={`${BASESCAN_BASE_URL}/address/${DONATION_DAO_ADDRESS}`} target="_blank">
                        <Button variant="outline" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on BaseScan
                        </Button>
                      </Link>
                    </div>
                  )
                ) : request.status === 'waiting_claim' ? (
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-orange-800">Approved by Donors</p>
                      <p className="text-xs text-orange-600">Waiting for beneficiary to claim funds</p>
                    </div>
                    {address && address.toLowerCase() === request.beneficiaryAddress.toLowerCase() && (
                      <Button onClick={handleClaim} disabled={donorVoting} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                        Claim Funds
                      </Button>
                    )}
                    <Link href={`${BASESCAN_BASE_URL}/address/${DONATION_DAO_ADDRESS}`} target="_blank">
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on BaseScan
                      </Button>
                    </Link>
                  </div>
                ) : request.status === 'disbursed' ? (
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium text-primary">Request Approved by Donors</p>
                      <p className="text-xs text-muted-foreground">Funds have been disbursed</p>
                    </div>
                    <Link href={`${BASESCAN_BASE_URL}/address/${DONATION_DAO_ADDRESS}`} target="_blank">
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on BaseScan
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {donorPhase?.active ? (
                      <div className="space-y-3">
                        <div className="text-center text-sm text-muted-foreground">
                          Donor voting active. Deadline: {donorPhase.deadline ? new Date(donorPhase.deadline * 1000).toLocaleString() : ''}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button onClick={() => handleDonorVote(true)} disabled={donorVoting} className="bg-green-600 hover:bg-green-700 text-white">
                            <ThumbsUp className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button onClick={() => handleDonorVote(false)} disabled={donorVoting} className="bg-red-600 hover:bg-red-700 text-white">
                            <ThumbsDown className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ) : donorPhase && donorPhase.deadline && Date.now() / 1000 > (donorPhase.deadline || 0) ? (
                      <div className="space-y-2">
                        <Button onClick={handleFinalize} disabled={donorVoting} className="w-full">Finalize by Donors</Button>
                        {address && address.toLowerCase() === request.beneficiaryAddress.toLowerCase() && (
                          <Button onClick={handleClaim} disabled={donorVoting} variant="outline" className="w-full">Claim Funds</Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-3 bg-destructive/10 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
                        <p className="text-sm font-medium text-destructive">Request Rejected by Donors</p>
                        <p className="text-xs text-muted-foreground">Voting has concluded</p>
                      </div>
                    )}
                    <Link href={`${BASESCAN_BASE_URL}/address/${DONATION_DAO_ADDRESS}`} target="_blank">
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on BaseScan
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
          {/* Preview Modal */}
    {isPreviewOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold">Preview</h3>
            <div className="flex items-center gap-2">
              {previewUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={previewUrl} download>
                    Download
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>Close</Button>
              </div>
            </div>
            <div className="aspect-video bg-gray-50">
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <Image src={previewUrl} alt="Preview" fill className="object-contain" unoptimized />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No preview</div>
              )}
            </div>
        </div>
      </div>
    )}
    </div>


  );
}
