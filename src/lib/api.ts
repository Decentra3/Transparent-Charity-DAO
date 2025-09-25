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
  _id: string
  donor_wallet: string
  project_id: string | null
  amount: string // Backend returns string, we'll convert to number in display
  tx_hash?: string
  createdAt: string
  updatedAt: string
  donateType?: string
  timestamp?: string
}

// User Types
export interface User {
  _id: string
  wallet_address: string
  username?: string
  email?: string
  avatar?: string
  isKYC: boolean
  status: 'active' | 'blocked'
  createdAt: string
  updatedAt: string
}

// Transaction Types
export interface Transaction {
  _id: string
  tx_hash: string
  from_address: string
  to_address: string
  amount: string // Backend returns string in wei
  event_type: string
  project_id: number | null
  block_number: number | null
  timestamp: string
  createdAt: string
  updatedAt: string
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
