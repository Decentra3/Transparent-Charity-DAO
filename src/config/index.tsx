import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { baseSepolia } from '@reown/appkit/networks'
import type { Chain } from 'viem'

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://transparent-charity-dao-be-production.up.railway.app/api'

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined. Please set it in .env.local')
}

export const networks: [Chain, ...Chain[]] = [baseSepolia]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
})

export const config = wagmiAdapter.wagmiConfig


