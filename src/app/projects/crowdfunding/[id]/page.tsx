'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle, Heart, Vote, ExternalLink, FileText, Image as ImageIcon, User, DollarSign, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { DONATION_DAO_ADDRESS, BASESCAN_BASE_URL } from '@/lib/contract-config';
import { getProjectById, getDaoMemberCount, isDaoMemberAddress } from '@/lib/contract';
import { RouteProtection } from '@/components/RouteProtection';
import { useWallet } from '@/hooks/useWallet';
import { useOnchainStore } from '@/lib/store';
import { formatUSDT, formatAddress } from '@/lib/utils';
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions';
import { config } from '@/config';
import { DonationDAOAbi } from '@/lib/abi/DonationDAO';
import { Input } from '@/components/ui/input';
import { donateToProject } from '@/lib/contract';
import { closeProjectOnChain } from '@/lib/contract';
import { getIPFSUrl, getFileType, formatIPFSHash } from '@/lib/ipfs';
import { useDonatesByProject } from '@/hooks/useApi';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
    case 'disbursed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'voting':
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'closed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Target className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'approved':
    case 'disbursed':
    case 'closed':
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

const formatStatus = (status: string) => {
  switch (status) {
    case 'voting':
      return 'Voting';
    case 'approved':
      return 'Approved';
    case 'disbursed':
      return 'Disbursed';
    case 'rejected':
      return 'Rejected';
    case 'closed':
      return 'Closed';
    case 'pending':
      return 'Pending';
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  }
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-blue-500';
};

// Mock AI Analysis data
const getMockAIAnalysis = (projectId: string) => ({
  fraudScore: Math.floor(Math.random() * 100),
  recommendation: Math.random() > 0.5 ? 'approve' : 'reject',
  confidence: Math.floor(Math.random() * 40) + 60,
  riskFactors: ['Unclear project goals', 'High funding target', 'New creator'],
  positiveFactors: ['Detailed description', 'Reasonable timeline', 'Clear milestones']
});

export default function CrowdfundingDetailPage() {
  return (
    <RouteProtection>
      <CrowdfundingDetailContent />
    </RouteProtection>
  );
}

function CrowdfundingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { isConnected, address, connectWallet } = useWallet();
  const { isLoading, isLoaded, activities, refresh } = useOnchainStore();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voteProgress, setVoteProgress] = useState({ approve: 0, reject: 0, total: 0 });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [isDAOMember, setIsDAOMember] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [donating, setDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState<{ hash: string; amount: string } | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeSuccessHash, setCloseSuccessHash] = useState<string | null>(null);
  const { showToast } = useToast();
  
  const { data: projectDonations, isLoading: donationsLoading } = useDonatesByProject(
    project?.status === 'approved' ? params.id as string : ''
  );

  useEffect(() => {
    (async () => {
      if (address) {
        const result = await isDaoMemberAddress(address as any)
        setIsDAOMember(result)
        console.log('[CrowdfundingDetail] isDAOMember =', result, 'for', address)
      } else {
        setIsDAOMember(false)
      }
    })()
  }, [address])

  useEffect(() => {
    if (!isLoaded && !isLoading) refresh();
  }, [isLoaded, isLoading, refresh]);

  useEffect(() => {
    (async () => {
      if (activities.length > 0 && params.id) {
        const idStr = String(params.id)
        // eslint-disable-next-line no-console
        console.log('[CrowdfundingDetail] params.id =', idStr)

        const foundProject = activities.find((activity: any) => 
          activity.activityType === 1 && String(activity.id) === idStr
        );

        // eslint-disable-next-line no-console
        console.log('[CrowdfundingDetail] activity found =', foundProject)

        try {
          const [onchain, memberCount] = await Promise.all([
            getProjectById(idStr),
            getDaoMemberCount(),
          ])

          // eslint-disable-next-line no-console
          console.log('[CrowdfundingDetail] getProjectById result =', onchain)
          // eslint-disable-next-line no-console
          console.log('[CrowdfundingDetail] daoMemberCount =', memberCount)

          setVoteProgress({
            approve: Number(onchain.approveCount ?? 0n),
            reject: Number(onchain.rejectCount ?? 0n),
            total: Number(memberCount ?? 0n),
          })

          setProject({
            id: idStr,
            owner: (onchain.owner as string) || (foundProject?.creator as string) || '',
            title: (onchain.title as string) || (foundProject?.title as string) || '',
            description: (onchain.description as string) || (foundProject?.description as string) || '',
            proofHash: (onchain.proofHash as string) || '',
            targetAmount: Number(onchain.targetAmount ?? 0n) / 1e6,
            currentAmount: Number(onchain.totalFunded ?? 0n) / 1e6,
            deadline: new Date(Number(onchain.deadline ?? 0n) * 1000).toISOString(),
            createdAt: new Date(Number(foundProject?.creationTimestamp || 0) * 1000).toISOString(),
            closed: Boolean(onchain.closed),
            status: Boolean(onchain.closed)
              ? 'closed'
              : onchain.decisionMade
              ? (onchain.approved ? 'approved' : 'rejected')
              : 'voting',
            donorCount: 0,
            aiAnalysis: getMockAIAnalysis(idStr),
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[CrowdfundingDetail] error fetching onchain detail:', err)
        } finally {
          setLoading(false)
        }
      }
    })()
  }, [activities, params.id]);

  // real DAO member state is derived earlier with isDaoMemberAddress -> setIsDAOMember

  const handleVote = async (decision: boolean) => {
    if (!project || !isConnected || !isDAOMember) return;
    
    try {
      setVoting(true);
      const hash = await writeContract(config, {
        abi: DonationDAOAbi as any,
        address: DONATION_DAO_ADDRESS as any,
        functionName: 'voteOnProject',
        args: [project.id, decision],
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

  const canClose = () => {
    if (!project) return false;
    console.log("address", address)
    console.log("project.owner", project.owner)
    const isOwner = address && project.owner && String(project.owner).toLowerCase() === String(address).toLowerCase();
    
    const pastDeadline = new Date(project.deadline) < new Date();
    return isOwner && project.status === 'approved' && !project.closed && pastDeadline;
  };

  const handleCloseProject = async () => {
    if (!project || !canClose()) return;
    try {
      setClosing(true);
      setCloseSuccessHash(null);
      const { hash } = await closeProjectOnChain(project.id);
      setCloseSuccessHash(hash);
      await refresh();
    } catch (e) {
      console.error('Close project failed:', e);
      showToast({ variant: 'error', title: 'Close project failed', description: 'Please try again.' });
    } finally {
      setClosing(false);
    }
  };

  const handleDonate = async () => {
    if (!project || !isConnected || !donateAmount) return;
    
    const amount = parseFloat(donateAmount);
    if (amount <= 0) {
      showToast({ variant: 'warning', title: 'Invalid amount', description: 'Please enter a valid donation amount.' });
      return;
    }
    
    try {
      setDonating(true);
      setDonationSuccess(null); // Clear previous success notification
      
      // Use the helper function that handles USDT approval automatically
      const result = await donateToProject(project.id, donateAmount);
      
      console.log('Donation successful:', result);
      
      // Set success state with transaction hash
      setDonationSuccess({
        hash: result.hash,
        amount: donateAmount
      });
      
      // Refresh data after successful donation
      await refresh();
      
      // Clear form
      setDonateAmount('');
      
    } catch (error) {
      console.error('Donation failed:', error);
      showToast({ variant: 'error', title: 'Donation failed', description: 'Please try again.' });
    } finally {
      setDonating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested crowdfunding project could not be found.</p>
          <Link href="/projects/crowdfunding">
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
          {JSON.stringify({ project }, null, 2)}
        </pre>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/projects/crowdfunding">
              <Button variant="outline" className="">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = typeof window !== 'undefined' ? `${window.location.origin}/projects/crowdfunding/${project.id}` : '';
                if (!url) return;
                if (navigator.share) {
                  navigator.share({ title: project.title, url }).catch(() => {
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
                  {project.title}
                </h1>
                <Badge variant="outline" className="bg-transparent text-primary border-border">
                  Crowdfunding
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Community-driven crowdfunding campaign
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Project Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Creator</p>
                      <p className="font-medium">{formatAddress(project.owner)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-accent p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Target Amount</span>
                    <span className="text-2xl font-bold text-primary">
                      ${formatUSDT(project.targetAmount)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Project Description</h4>
                  <p className="text-muted-foreground leading-relaxed bg-accent p-4 rounded-lg">
                    {project.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress for approved projects */}
            {project.status === 'approved' && (
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>Funding Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-muted-foreground">Raised</span>
                    <span className="font-bold text-primary">
                      ${formatUSDT(project.currentAmount)} / ${formatUSDT(project.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 bg-primary`}
                      style={{ width: `${Math.min((project.currentAmount / project.targetAmount) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{Math.round((project.currentAmount / project.targetAmount) * 100)}% funded</span>
                    <span>{project.donorCount} donors</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Files/Evidence */}
            {project.proofHash && (
              <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Project Materials</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* File Preview */}
                    {getFileType(project.proofHash) === 'image' ? (
                      <div className="space-y-2">
                        <img
                          src={getIPFSUrl(project.proofHash)}
                          alt="Project Material"
                          className="w-full max-w-md rounded-lg border border-border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          IPFS Hash: {formatIPFSHash(project.proofHash)}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4 p-4 bg-accent rounded-lg md:flex-row flex-col gap-2 md:gap-0">
                        <FileText className="h-8 w-8 text-primary hidden md:block" />
                        <div className="flex-1">
                          <p className="font-medium">Project Document</p>
                          <p className="text-sm text-muted-foreground">
                            IPFS Hash: {formatIPFSHash(project.proofHash)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setPreviewUrl(getIPFSUrl(project.proofHash));
                              setIsPreviewOpen(true);
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {getIPFSUrl(project.proofHash) && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={getIPFSUrl(project.proofHash)} download>
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

            {/* Voting Progress - Only show when voting is active */}
            {project.status === 'voting' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Vote className="h-5 w-5 text-green-600" />
                    <span>Voting Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsUp className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Approve</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{voteProgress.approve}</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsDown className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-800">Reject</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">{voteProgress.reject}</div>
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    Total DAO Members: {voteProgress.total}
                  </div>
                  
                  {voteProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Approval Rate</span>
                        <span>{Math.round((voteProgress.approve / voteProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(voteProgress.approve / voteProgress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Voting Results - Show when voting is complete */}
            {project.status !== 'voting' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {project.status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <span>Voting Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsUp className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Approve</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{voteProgress.approve}</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <ThumbsDown className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-800">Reject</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">{voteProgress.reject}</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      project.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {project.status === 'approved' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Project Approved
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Project Rejected
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
                  {getStatusIcon(project.status)}
                  <span>Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getStatusColor(project.status)} className="text-lg px-4 py-2">
                  {formatStatus(project.status)}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  {project.status === 'voting' 
                    ? 'This project is currently under review by DAO members.'
                    : project.status === 'approved'
                    ? 'This project has been approved and is accepting donations.'
                    : project.status === 'closed'
                    ? 'This project has been closed by its owner after the deadline.'
                    : 'This project has been rejected.'}
                </p>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Fraud Risk Score</span>
                    <span className={`font-medium ${
                      project.aiAnalysis.fraudScore < 30 ? 'text-green-600' :
                      project.aiAnalysis.fraudScore < 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {project.aiAnalysis.fraudScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        project.aiAnalysis.fraudScore < 30 ? 'bg-green-500' :
                        project.aiAnalysis.fraudScore < 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${project.aiAnalysis.fraudScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Recommendation</span>
                    <span className={`font-medium capitalize ${
                      project.aiAnalysis.recommendation === 'approve' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {project.aiAnalysis.recommendation}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Confidence: {project.aiAnalysis.confidence}%
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
                {project.status === 'voting' ? (
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
                ) : project.status === 'approved' ? (
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">Project Approved</p>
                      <p className="text-xs text-green-600">Ready to receive donations</p>
                    </div>
                    
                    {/* Close project (owner only, after deadline) */}
                    {canClose() && (
                      <div className="space-y-2">
                        <Button 
                          variant="destructive"
                          className="w-full"
                          onClick={handleCloseProject}
                          disabled={closing}
                        >
                          {closing ? 'Closing project...' : 'Close Project'}
                        </Button>
                        {closeSuccessHash && (
                          <div className="text-xs text-green-700">
                            Closed.{' '}
                            <a 
                              href={`${BASESCAN_BASE_URL}/tx/${closeSuccessHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              View on BaseScan
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Donations gated by closed status and deadline */}
                    {project.closed || new Date(project.deadline) < new Date() ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 text-center">
                          {project.closed ? 'Project is closed and no longer accepting donations.' : 'Deadline passed. Donations are closed.'}
                        </p>
                      </div>
                    ) : isConnected ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Donation Amount (USDT)
                          </label>
                          <Input
                            type="number"
                            value={donateAmount}
                            onChange={(e) => {
                              setDonateAmount(e.target.value);
                              setDonationSuccess(null); // Clear success notification when amount changes
                            }}
                            placeholder="Enter amount"
                            min="0.01"
                            step="0.01"
                            className="w-full"
                          />
                          {donateAmount && parseFloat(donateAmount) <= 0 && (
                            <p className="text-xs text-red-600 mt-1">Please enter a valid amount</p>
                          )}
                        </div>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleDonate}
                          disabled={donating || !donateAmount || parseFloat(donateAmount) <= 0}
                        >
                          {donating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Donating...
                            </>
                          ) : (
                            <>
                              <Heart className="h-4 w-4 mr-2" />
                              Donate to Project
                            </>
                          )}
                        </Button>
                        
                        {/* Success Notification */}
                        {donationSuccess && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Donation Successful!
                              </span>
                            </div>
                            <p className="text-xs text-green-700 mb-2">
                              Thank you for donating ${donationSuccess.amount} USDT to this project.
                            </p>
                            <div className="flex items-center space-x-2">
                              <ExternalLink className="h-3 w-3 text-green-600" />
                              <a
                                href={`${BASESCAN_BASE_URL}/tx/${donationSuccess.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:text-green-800 underline"
                              >
                                View on BaseScan
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 text-center">
                          Connect your wallet to donate
                        </p>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={connectWallet}
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Connect Wallet to Donate
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-red-800">Project Rejected</p>
                      <p className="text-xs text-red-600">Voting has concluded</p>
                    </div>
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

            {/* Recent Donations Card - Only show for active projects */}
            {project.status === 'approved' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5" />
                    <span>Recent Donations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Total Donations Summary */}
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Total Raised</p>
                          <p className="text-lg font-bold text-purple-600">
                            ${formatUSDT(Number(project.totalFunded) || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">of ${formatUSDT(Number(project.targetAmount) || 0)}</p>
                          <p className="text-sm font-medium text-purple-600">
                            {project.targetAmount && Number(project.targetAmount) > 0 
                              ? Math.round((Number(project.totalFunded) || 0) / Number(project.targetAmount) * 100)
                              : 0}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recent Donations List */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Recent Donations</h4>
                      {donationsLoading ? (
                        <div className="text-center py-4 text-muted-foreground">Loading donations...</div>
                      ) : projectDonations && projectDonations.length > 0 ? (
                        projectDonations.slice(0, 5).map((donation: any) => (
                          <div key={donation._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Heart className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatAddress(donation.donor_wallet)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(donation.createdAt || donation.timestamp).toLocaleDateString()} at{' '}
                                  {new Date(donation.createdAt || donation.timestamp).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">
                                +${(parseFloat(donation.amount) / 1000000).toFixed(2)}
                              </p>
                              {donation.tx_hash && (
                                <Link
                                  href={`${BASESCAN_BASE_URL}/tx/${donation.tx_hash}`}
                                  target="_blank"
                                  className="text-xs text-primary hover:underline"
                                >
                                  View TX
                                </Link>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No donations yet for this project
                        </div>
                      )}
                    </div>

                    {/* View on BaseScan */}
                    <div className="pt-2 border-t">
                      <Link href={`${BASESCAN_BASE_URL}/address/${DONATION_DAO_ADDRESS}`} target="_blank">
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View All Transactions on BaseScan
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      </div>

          {/* Preview Modal */}
    {isPreviewOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white w-full max-w-5xl rounded-lg shadow-lg overflow-hidden">
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
