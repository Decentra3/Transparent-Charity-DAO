import { apiBaseUrl } from '@/config'

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Donate Types
export interface Donate {
  id: string
  donor_wallet: string
  project_id: string
  amount: number
  transaction_hash?: string
  created_at: string
  updated_at: string
}

// User Types
export interface User {
  id: string
  wallet_address: string
  name?: string
  email?: string
  avatar?: string
  kyc_status: 'pending' | 'verified' | 'rejected'
  status: 'active' | 'blocked'
  created_at: string
  updated_at: string
}

// Transaction Types
export interface Transaction {
  id: string
  from_address: string
  to_address: string
  amount: number
  transaction_hash: string
  type: 'donate' | 'withdraw' | 'transfer'
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
  updated_at: string
}

// Proposal Analysis Types
export interface ProposalAnalysis {
  project_id: string
  analysis_result: {
    score: number
    recommendations: string[]
    risks: string[]
    strengths: string[]
  }
  created_at: string
}

export interface AnalyzeProposalRequest {
  project_id: string
  text: string
  imageBase64?: string
}

// Base API class
class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = apiBaseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Donates API
  async getDonates(): Promise<ApiResponse<Donate[]>> {
    return this.request<Donate[]>('/donates')
  }

  async getDonatesByDonor(donorWallet: string): Promise<ApiResponse<Donate[]>> {
    return this.request<Donate[]>(`/donates/donor/${donorWallet}`)
  }

  async getDonatesByProject(projectId: string): Promise<ApiResponse<Donate[]>> {
    return this.request<Donate[]>(`/donates/project/${projectId}`)
  }

  // Users API - Matching backend userController
  async createUser(user: { wallet_address: string; email?: string }): Promise<ApiResponse<User>> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    })
  }

  async getUserByWallet(wallet: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${wallet}`)
  }

  async updateUser(id: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async setKYC(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}/kyc`, {
      method: 'PATCH',
    })
  }

  async setUserStatus(id: string, status: 'active' | 'blocked'): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  // Transactions API - Matching backend transactionController
  async getTransactions(limit?: number): Promise<ApiResponse<Transaction[]>> {
    const url = limit ? `/transactions?limit=${limit}` : '/transactions'
    return this.request<Transaction[]>(url)
  }

  async getTransactionsByAddress(fromAddress: string): Promise<ApiResponse<Transaction[]>> {
    return this.request<Transaction[]>(`/transactions/address/${fromAddress}`)
  }

  // Analyzing API - Matching backend analyzingController
  async analyzeProposal(proposal: AnalyzeProposalRequest): Promise<ApiResponse<ProposalAnalysis>> {
    return this.request<ProposalAnalysis>('/analyze', {
      method: 'POST',
      body: JSON.stringify(proposal),
    })
  }

  async getAiResult(projectId: string): Promise<ApiResponse<ProposalAnalysis>> {
    return this.request<ProposalAnalysis>(`/analyze/result/${projectId}`)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export individual functions for convenience
export const {
  getDonates,
  getDonatesByDonor,
  getDonatesByProject,
  createUser,
  getUserByWallet,
  updateUser,
  setKYC,
  setUserStatus,
  getTransactions,
  getTransactionsByAddress,
  analyzeProposal,
  getAiResult,
} = apiClient
