import { create } from 'zustand'
import { getFundBalance, getActivities, isDaoMemberAddress, getDonorFlags } from '@/lib/contract'
import { User } from '@/lib/api'

type OnchainState = {
  isLoading: boolean
  isLoaded: boolean
  error: string | null
  fundBalance: string
  activities: any[]
  address: string | null
  isConnected: boolean
  isDaoMember: boolean
  isDonor: boolean
  hasDonorSbt: boolean
  totalFundDonated: string
  user: User | null
  refresh: () => Promise<void>
  setWallet: (address: string | null, isConnected: boolean) => Promise<void>
  setUser: (user: User | null) => void
}

export const useOnchainStore = create<OnchainState>((set, get) => ({
  isLoading: false,
  isLoaded: false,
  error: null,
  fundBalance: '0',
  activities: [],
  address: null,
  isConnected: false,
  isDaoMember: false,
  isDonor: false,
  hasDonorSbt: false,
  totalFundDonated: '0',
  user: null,
  refresh: async () => {
    set({ isLoading: true, error: null })
    try {
      const [fund, activities] = await Promise.all([
        getFundBalance().catch(() => '0'),
        getActivities().catch(() => []),
      ])
      set({ fundBalance: fund, activities: activities as any[], isLoaded: true })
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load on-chain data' })
    } finally {
      set({ isLoading: false })
    }
  },
  setWallet: async (address, isConnected) => {
    // eslint-disable-next-line no-console
    console.log('[store] setWallet called:', { address, isConnected })
    set({ address, isConnected })
    try {
      let isDao = false
      let donor = { isDonor: false, hasSbt: false, totalFundDonated: '0' }
      if (address && isConnected) {
        isDao = await isDaoMemberAddress(address)
        try {
          const flags = await getDonorFlags(address)
          donor = { isDonor: flags.isDonor, hasSbt: flags.hasSbt, totalFundDonated: flags.totalFundDonated }
        } catch {}
      }
      set({ isDaoMember: isDao, isDonor: donor.isDonor, hasDonorSbt: donor.hasSbt, totalFundDonated: donor.totalFundDonated })
      // eslint-disable-next-line no-console
      console.log('[store] isDaoMember resolved:', isDao)
    } catch (e) {
      set({ isDaoMember: false, isDonor: false, hasDonorSbt: false, totalFundDonated: '0' })
      // eslint-disable-next-line no-console
      console.warn('[store] setWallet isDaoMember check failed:', e)
    }
  },
  setUser: (user) => {
    set({ user });
  },
}))


