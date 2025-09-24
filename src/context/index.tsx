'use client'

import React, { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, cookieToInitialState, type Config } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { config, networks, projectId, wagmiAdapter } from '@/config'
import { baseSepolia } from '@reown/appkit/networks'
import { ThemeProvider } from './ThemeContext'
import { ToastProvider } from './ToastContext'

const queryClient = new QueryClient()

const metadata = {
  name: 'Transparent Charity DAO',
  description: 'Web3-enabled transparent charity application',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  icons: ['/vercel.svg'],
}

if (!projectId) {
  console.error('AppKit Initialization Error: Project ID is missing.')
} else {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId: projectId!,
    networks,
    defaultNetwork: baseSepolia,
    metadata,
    features: { analytics: true },
  })
}

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(config as Config, cookies)

  return (
    <WagmiProvider config={config as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


