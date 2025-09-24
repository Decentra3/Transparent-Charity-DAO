import { DonationRequest, Donation, DAOMember, FundStats, Transaction } from './types';

// Mock data for development
export const mockFundStats: FundStats = {
  totalFund: 125000.50,
  totalDisbursed: 78500.25,
  totalProjects: 156,
  activeRequests: 12
};

export const mockDAOMembers: DAOMember[] = [
  {
    id: '1',
    address: '0x1234567890123456789012345678901234567890',
    reputation: 95,
    totalVotes: 150,
    totalUSDTProcessed: 45000,
    joinedAt: '2024-01-15',
    isActive: true
  },
  {
    id: '2',
    address: '0x2234567890123456789012345678901234567890',
    reputation: 88,
    totalVotes: 120,
    totalUSDTProcessed: 32000,
    joinedAt: '2024-02-20',
    isActive: true
  },
  {
    id: '3',
    address: '0x3234567890123456789012345678901234567890',
    reputation: 92,
    totalVotes: 95,
    totalUSDTProcessed: 28500,
    joinedAt: '2024-03-10',
    isActive: true
  }
];

export const mockDonationRequests: DonationRequest[] = [
  {
    id: '1',
    beneficiaryId: 'user1',
    beneficiaryAddress: '0x4234567890123456789012345678901234567890',
    amount: 5000,
    reason: 'Medical emergency - Surgery required for heart condition',
    evidence: ['medical_report.pdf', 'doctor_prescription.jpg'],
    status: 'voting',
    type: 'request',
    createdAt: '2024-12-01',
    votingDeadline: '2024-12-08',
    votes: [
      {
        id: 'v1',
        voterId: '1',
        voterAddress: '0x1234567890123456789012345678901234567890',
        requestId: '1',
        decision: 'approve',
        comment: 'Medical evidence looks legitimate',
        votedAt: '2024-12-02'
      }
    ],
    aiAnalysis: {
      fraudScore: 15,
      confidence: 85,
      riskFactors: ['New user', 'High amount requested'],
      recommendation: 'review',
      summary: 'Medical documents appear authentic, but user profile needs verification'
    }
  },
  {
    id: '2',
    beneficiaryId: 'user2',
    beneficiaryAddress: '0x5234567890123456789012345678901234567890',
    amount: 2500,
    reason: 'Education support for children in rural area',
    evidence: ['school_enrollment.pdf', 'family_photos.jpg'],
    status: 'voting',
    type: 'request',
    createdAt: '2024-12-03',
    votes: [],
    aiAnalysis: {
      fraudScore: 25,
      confidence: 78,
      riskFactors: ['Location verification needed'],
      recommendation: 'review',
      summary: 'Education request appears valid, recommend location verification'
    }
  },
  {
    id: '3',
    beneficiaryId: 'user3',
    beneficiaryAddress: '0x6234567890123456789012345678901234567890',
    amount: 10000,
    reason: 'Help Sarah with Cancer Treatment',
    evidence: ['medical_bills.pdf', 'hospital_records.pdf'],
    status: 'approved',
    type: 'crowdfunding',
    createdAt: '2024-11-15',
    campaignDuration: 60,
    currentAmount: 7500,
    donorCount: 45,
    endDate: '2025-01-14',
    votes: [],
    aiAnalysis: {
      fraudScore: 10,
      confidence: 95,
      riskFactors: [],
      recommendation: 'approve',
      summary: 'Legitimate medical case with complete documentation'
    }
  },
  {
    id: '4',
    beneficiaryId: 'user4',
    beneficiaryAddress: '0x7234567890123456789012345678901234567890',
    amount: 8000,
    reason: 'Support Local School Technology Upgrade',
    evidence: ['school_proposal.pdf', 'budget_breakdown.xlsx'],
    status: 'voting',
    type: 'crowdfunding',
    createdAt: '2024-11-20',
    campaignDuration: 45,
    currentAmount: 3200,
    donorCount: 28,
    endDate: '2025-01-04',
    votes: [],
    aiAnalysis: {
      fraudScore: 20,
      confidence: 88,
      riskFactors: ['Institution verification needed'],
      recommendation: 'approve',
      summary: 'Educational project with detailed proposal'
    }
  },
  {
    id: '5',
    beneficiaryId: 'user5',
    beneficiaryAddress: '0x8234567890123456789012345678901234567890',
    amount: 15000,
    reason: 'Clean Water Project for Remote Village',
    evidence: ['village_photos.jpg', 'water_test_results.pdf'],
    status: 'completed',
    type: 'crowdfunding',
    createdAt: '2024-10-01',
    campaignDuration: 90,
    currentAmount: 15000,
    donorCount: 120,
    endDate: '2024-12-30',
    votes: [],
    aiAnalysis: {
      fraudScore: 5,
      confidence: 98,
      riskFactors: [],
      recommendation: 'approve',
      summary: 'Excellent community project with verified impact'
    }
  }
];

export const mockDonations: Donation[] = [
  {
    id: '1',
    donorId: 'donor1',
    donorAddress: '0x6234567890123456789012345678901234567890',
    amount: 1000,
    transactionHash: '0xabc123def456...',
    createdAt: '2024-12-01'
  },
  {
    id: '2',
    donorId: 'donor2',
    donorAddress: '0x7234567890123456789012345678901234567890',
    amount: 500,
    transactionHash: '0xdef456ghi789...',
    createdAt: '2024-12-02'
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'donation',
    amount: 1000,
    from: '0x6234567890123456789012345678901234567890',
    to: '0x0000000000000000000000000000000000000000',
    transactionHash: '0xabc123def456...',
    timestamp: '2024-12-01T10:30:00Z',
    status: 'confirmed'
  },
  {
    id: '2',
    type: 'disbursement',
    amount: 5000,
    from: '0x0000000000000000000000000000000000000000',
    to: '0x4234567890123456789012345678901234567890',
    transactionHash: '0x123abc456def...',
    timestamp: '2024-11-28T14:20:00Z',
    status: 'confirmed'
  }
];
