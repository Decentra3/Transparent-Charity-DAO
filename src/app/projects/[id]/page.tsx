'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  Vote, 
  Calendar, 
  DollarSign, 
  User, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DonateModal } from '@/components/DonateModal';
import { useWallet } from '@/hooks/useWallet';
import { mockDonationRequests } from '@/lib/mock-data';
import { formatUSDT, formatAddress } from '@/lib/utils';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
    case 'disbursed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'voting':
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'rejected':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    default:
      return <TrendingUp className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'approved':
    case 'disbursed':
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

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useWallet();
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [voteDecision, setVoteDecision] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  
  const projectId = params.id as string;
  const project = mockDonationRequests.find(req => req.id === projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">The project you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const progress = project.currentAmount ? (project.currentAmount / project.amount) * 100 : 0;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleVote = async () => {
    if (!voteDecision) return;
    
    setIsSubmitting(true);
    
    // Simulate voting process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setHasVoted(true);
    setIsSubmitting(false);
    
    // Reset voting form
    setVoteDecision(null);
    setComment('');
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Projects</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleShare}
            className="flex items-center space-x-2"
          >
            {isShareCopied ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Share Project</span>
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-2xl font-bold text-gray-900">
                        Project #{project.id}
                      </h1>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(project.status)}
                        <Badge variant={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{formatAddress(project.beneficiaryAddress)}</span>
                      </div>
                    </div>

                    <Badge 
                      variant="outline" 
                      className={
                        project.type === 'request' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }
                    >
                      {project.type === 'request' ? 'Request Fund' : 'Crowdfunding'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Project Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {project.reason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence */}
            {project.evidence && project.evidence.length > 0 && (
            <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                    <span>Supporting Evidence</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {project.evidence.map((file, index) => (
                      <div 
                        key={index}
                      className="flex items-center justify-between p-3 bg-accent rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analysis */}
            {project.aiAnalysis && (
            <Card className="bg-card border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                    <span>AI Risk Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-accent rounded-lg">
                      <div className="text-2xl font-bold">
                          {project.aiAnalysis.fraudScore}%
                        </div>
                      <div className="text-sm text-muted-foreground">Risk Score</div>
                      </div>
                    <div className="text-center p-3 bg-accent rounded-lg">
                      <div className="text-2xl font-bold">
                          {project.aiAnalysis.confidence}%
                        </div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      </div>
                    </div>
                    
                    <div>
                    <h4 className="font-medium mb-2">Analysis Summary</h4>
                    <p className="text-sm text-muted-foreground">{project.aiAnalysis.summary}</p>
                    </div>
                    
                    {project.aiAnalysis.riskFactors.length > 0 && (
                      <div>
                      <h4 className="font-medium mb-2">Risk Factors</h4>
                        <div className="space-y-1">
                        {project.aiAnalysis.riskFactors.map((factor, index) => (
                          <div key={index} className="text-sm text-foreground bg-accent px-2 py-1 rounded">
                              • {factor}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>
                    {project.type === 'request' ? 'Request Amount' : 
                     project.status === 'voting' ? 'Voting Progress' : 'Funding'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* For request funds or voting status: show only amount */}
                  {(project.type === 'request' || project.status === 'voting') && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        ${formatUSDT(project.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {project.type === 'request' ? 'Request amount' : 'Target amount'}
                      </div>
                    </div>
                  )}

                  {/* For crowdfunding when approved: show funding progress */}
                  {project.type === 'crowdfunding' && project.status === 'approved' && (
                    <>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          ${formatUSDT(project.currentAmount || 0)}
                        </div>
                        <div className="text-sm text-gray-600">
                          raised of ${formatUSDT(project.amount)} goal
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.round(progress)}%
                          </div>
                          <div className="text-xs text-gray-600">Completed</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {project.donorCount || 0}
                          </div>
                          <div className="text-xs text-gray-600">Donors</div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Voting Progress for projects in voting status */}
                  {project.status === 'voting' && project.votes && (
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {project.votes.length} / 3
                        </div>
                        <div className="text-sm text-gray-600">DAO members voted</div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((project.votes.length / 3) * 100, 100)}%` }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.round((project.votes.length / 3) * 100)}%
                          </div>
                          <div className="text-xs text-gray-600">Participation</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.ceil(3 * 0.5)} 
                          </div>
                          <div className="text-xs text-gray-600">Needed (50%)</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons - Sticky */}
            <div className="sticky top-8 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {/* Crowdfunding: Donate Button (only when approved) */}
                    {project.type === 'crowdfunding' && project.status === 'approved' && (
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3"
                        onClick={() => setIsDonateModalOpen(true)}
                      >
                        <Heart className="h-5 w-5 mr-2" />
                        Donate Now
                      </Button>
                    )}
                    
                    {/* Voting: Vote Button (DAO members only) for both request and crowdfunding */}
                    {project.status === 'voting' && user?.role === 'dao_member' && !hasVoted && (
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">You can vote on this request</div>
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3"
                          onClick={() => {
                            // Scroll to voting section
                            document.getElementById('voting-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <Vote className="h-5 w-5 mr-2" />
                          Cast Your Vote
                        </Button>
                      </div>
                    )}

                    {/* Already voted message */}
                    {project.status === 'voting' && user?.role === 'dao_member' && hasVoted && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <div className="text-sm font-medium text-green-800">Vote Submitted</div>
                        <div className="text-xs text-green-600">Thank you for participating</div>
                      </div>
                    )}

                    {/* Voting in progress (for non-DAO members) */}
                    {project.status === 'voting' && user?.role !== 'dao_member' && (
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                        <div className="text-sm font-medium text-yellow-800">Voting in Progress</div>
                        <div className="text-xs text-yellow-600">DAO members are reviewing this request</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Voting Interface for DAO Members */}
              {project.status === 'voting' && user?.role === 'dao_member' && !hasVoted && (
                <Card id="voting-section">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Vote className="h-5 w-5 text-purple-500" />
                      <span>Cast Your Vote</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Vote Decision */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Your Decision
                      </label>
                      <div className="space-y-2">
                        <Button
                          variant={voteDecision === 'approve' ? 'default' : 'outline'}
                          onClick={() => setVoteDecision('approve')}
                          className={`w-full justify-start ${
                            voteDecision === 'approve' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'border-green-300 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Request
                        </Button>
                        <Button
                          variant={voteDecision === 'reject' ? 'default' : 'outline'}
                          onClick={() => setVoteDecision('reject')}
                          className={`w-full justify-start ${
                            voteDecision === 'reject' 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'border-red-300 text-red-700 hover:bg-red-50'
                          }`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Request
                        </Button>
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comment (Optional)
                      </label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Explain your decision..."
                        rows={3}
                      />
                    </div>

                    {/* Submit Vote */}
                    <Button
                      onClick={handleVote}
                      disabled={!voteDecision || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting Vote...
                        </>
                      ) : (
                        <>
                          <Vote className="h-4 w-4 mr-2" />
                          Submit Vote
                        </>
                      )}
                    </Button>

                    {/* Voting Guidelines */}
                    <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
                      <p className="font-medium">Voting Guidelines:</p>
                      <p>• Consider AI analysis and evidence</p>
                      <p>• Verify legitimacy of the request</p>
                      <p>• Ensure funds will be used appropriately</p>
                      <p>• Vote based on community best interests</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Previous Votes Display */}
              {project.votes && project.votes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span>Voting Progress</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {project.votes.map((vote) => (
                        <div key={vote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {vote.decision === 'approve' ? 
                              <CheckCircle className="h-5 w-5 text-green-500" /> :
                              <XCircle className="h-5 w-5 text-red-500" />
                            }
                            <div>
                              <div className="font-medium text-sm">{formatAddress(vote.voterAddress)}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(vote.votedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <Badge variant={vote.decision === 'approve' ? 'default' : 'destructive'} className="text-xs">
                            {vote.decision}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Donate Modal */}
        {project && (
          <DonateModal
            isOpen={isDonateModalOpen}
            onClose={() => setIsDonateModalOpen(false)}
            project={project}
          />
        )}
      </div>
    </div>
  );
}