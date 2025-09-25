import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  apiClient, 
  type Donate, 
  type User, 
  type Transaction,
  type ProposalAnalysis,
  type AnalyzeProposalRequest,
  type ApiResponse 
} from '@/lib/api'

// Query Keys
export const queryKeys = {
  donates: ['donates'] as const,
  donatesByDonor: (donorWallet: string) => ['donates', 'donor', donorWallet] as const,
  donatesByProject: (projectId: string) => ['donates', 'project', projectId] as const,
  users: ['users'] as const,
  user: (wallet: string) => ['users', wallet] as const,
  transactions: ['transactions'] as const,
  transactionsByAddress: (address: string) => ['transactions', 'address', address] as const,
  aiResult: (projectId: string) => ['ai', 'result', projectId] as const,
}

// Donates Hooks
export function useDonates() {
  return useQuery({
    queryKey: queryKeys.donates,
    queryFn: () => apiClient.getDonates(),
    select: (data: any) => {      
      // Handle double-wrapped response: data.data.data
      if (data.success && data.data && data.data.success && Array.isArray(data.data.data)) {
        return data.data.data;
      }
      
      // Handle normal response: data.data
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      
      return [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useDonatesByDonor(donorWallet: string) {
  return useQuery({
    queryKey: queryKeys.donatesByDonor(donorWallet),
    queryFn: () => apiClient.getDonatesByDonor(donorWallet),
    select: (data: any) => {      
      // Handle double-wrapped response: data.data.data
      if (data.success && data.data && data.data.success && Array.isArray(data.data.data)) {
        return data.data.data;
      }
      
      // Handle normal response: data.data
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      
      return [];
    },
    enabled: !!donorWallet,
    staleTime: 2 * 60 * 1000,
  })
}

export function useDonatesByProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.donatesByProject(projectId),
    queryFn: () => apiClient.getDonatesByProject(projectId),
    select: (data: any) => {
      // Handle double-wrapped response: data.data.data
      if (data.success && data.data && data.data.success && Array.isArray(data.data.data)) {
        return data.data.data;
      }
      
      // Handle normal response: data.data
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      
      return [];
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  })
}

// Users Hooks
export function useUser(wallet: string) {
  return useQuery({
    queryKey: queryKeys.user(wallet),
    queryFn: () => apiClient.getUserByWallet(wallet),
    select: (data: any) => {
      // Handle double-wrapped response: data.data.data
      if (data.success && data.data && data.data.success && data.data.data) {
        return data.data.data;
      }
      
      // Handle normal response: data.data
      if (data.success && data.data) {
        return data.data;
      }
      
      return null;
    },
    enabled: !!wallet,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (user: { wallet_address: string; email?: string }) => 
      apiClient.createUser(user),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      if (data.success && data.data) {
        queryClient.setQueryData(queryKeys.user(variables.wallet_address), data)
      }
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) => 
      apiClient.updateUser(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      // Invalidate user query if we have wallet info
      if (data.success && data.data?.wallet_address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user(data.data.wallet_address) })
      }
    },
  })
}

export function useSetUserKyc() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      apiClient.setKYC(id),
    onSuccess: (data: ApiResponse<User>) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      if (data.success && data.data?.wallet_address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user(data.data.wallet_address) })
      }
    },
  })
}

export function useSetUserStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'blocked' }) => 
      apiClient.setUserStatus(id, status),
    onSuccess: (data: ApiResponse<User>) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      if (data.success && data.data?.wallet_address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user(data.data.wallet_address) })
      }
    },
  })
}

// Transactions Hooks
export function useTransactions(limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.transactions, limit],
    queryFn: () => apiClient.getTransactions(limit),
    select: (data: any) => {
      // Handle double-wrapped response: data.data.data
      if (data.success && data.data && data.data.success && Array.isArray(data.data.data)) {
        return data.data.data;
      }
      
      // Handle normal response: data.data
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      
      return [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useTransactionsByAddress(address: string) {
  return useQuery({
    queryKey: queryKeys.transactionsByAddress(address),
    queryFn: () => apiClient.getTransactionsByAddress(address),
    select: (data: any) => {
      // Handle double-wrapped response: data.data.data
      if (data.success && data.data && data.data.success && Array.isArray(data.data.data)) {
        return data.data.data;
      }
      
      // Handle normal response: data.data
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      
      return [];
    },
    enabled: !!address,
    staleTime: 1 * 60 * 1000,
  })
}

// AI Analysis Hooks
export function useAiResult(projectId: string) {
  return useQuery({
    queryKey: queryKeys.aiResult(projectId),
    queryFn: () => apiClient.getAiResult(projectId),
    select: (data) => data.success ? data.data : null,
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000, // 10 minutes - analysis doesn't change often
  })
}

export function useAnalyzeProposal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (proposal: AnalyzeProposalRequest) => 
      apiClient.analyzeProposal(proposal),
    onSuccess: (data, variables) => {
      // Invalidate the analysis query for this project
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.aiResult(variables.project_id) 
      })
    },
  })
}

// Utility hook for API status
export function useApiStatus() {
  return useQuery({
    queryKey: ['apiStatus'],
    queryFn: async () => {
      try {
        // Try to fetch donates as a health check
        const response = await apiClient.getDonates()
        return response.success
      } catch {
        return false
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: false,
  })
}

// Dashboard Stats Hook (computed from various endpoints)
export function useDashboardStats() {
  const { data: donates } = useDonates()
  const { data: transactions } = useTransactions()
  
  return useQuery({
    queryKey: ['dashboardStats', donates?.length, transactions?.length],
    queryFn: () => {
      if (!donates || !transactions) return null
      
      const totalDonated = donates.reduce((sum: number, donate: any) => sum + (parseFloat(donate.amount) / 1000000), 0)
      const totalTransactions = transactions.length
      const uniqueDonors = new Set(donates.map((d: any) => d.donor_wallet)).size
      const uniqueProjects = new Set(donates.map((d: any) => d.project_id).filter(Boolean)).size
      
      return {
        totalDonated,
        totalTransactions,
        totalDonors: uniqueDonors,
        totalProjects: uniqueProjects,
        recentDonations: donates.slice(-10), // Last 10 donations
      }
    },
    enabled: !!donates && !!transactions,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
