export interface User {
  id: string;
  address: string;
  role: 'user' | 'dao_member';
  profile?: UserProfile;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  joinedAt: string;
}

export interface DonationRequest {
  id: string;
  beneficiaryId: string;
  beneficiaryAddress: string;
  amount: number;
  reason: string;
  evidence: string[];
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'disbursed' | 'active' | 'completed';
  type: 'request' | 'crowdfunding';
  createdAt: string;
  votingDeadline?: string;
  votes: Vote[];
  aiAnalysis?: AIAnalysis;
  // Crowdfunding specific fields
  campaignDuration?: number;
  currentAmount?: number;
  donorCount?: number;
  endDate?: string;
}

export interface Vote {
  id: string;
  voterId: string;
  voterAddress: string;
  requestId: string;
  decision: 'approve' | 'reject';
  comment?: string;
  votedAt: string;
}

export interface Donation {
  id: string;
  donorId: string;
  donorAddress: string;
  amount: number;
  transactionHash: string;
  createdAt: string;
}

export interface DAOMember {
  id: string;
  address: string;
  reputation: number;
  totalVotes: number;
  totalUSDTProcessed: number;
  joinedAt: string;
  isActive: boolean;
}

export interface FundStats {
  totalFund: number;
  totalDisbursed: number;
  totalProjects: number;
  activeRequests: number;
}

export interface AIAnalysis {
  fraudScore: number; // 0-100, higher = more suspicious
  confidence: number; // 0-100, confidence in the analysis
  riskFactors: string[];
  recommendation: 'approve' | 'review' | 'reject';
  summary: string;
}

export interface Transaction {
  id: string;
  type: 'donation' | 'disbursement';
  amount: number;
  from?: string;
  to?: string;
  transactionHash: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}
