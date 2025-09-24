'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Address } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BASESCAN_BASE_URL } from '@/lib/contract'
import { MOCK_USDT_ADDRESS } from '@/lib/abi/MockUSDT'

export default function FaucetPage() {
  return <FaucetContent />
}

function FaucetContent() {
  const [address, setAddress] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requestFaucet = async () => {
    setError(null)
    setTxHash(null)
    if (!address) {
      setError('Please enter a wallet address')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/usdt-faucet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: address as Address })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Mint failed')
      setTxHash(json.txHash)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-8 pb-16 bg-[hsl(var(--background))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-4 bg-transparent text-primary border-border">💧 USDT Faucet</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Request 1,000 Test USDT</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Use this faucet to get test USDT (6 decimals) on Base Sepolia for donations and project testing.
            <br />
            <strong className="text-primary">
              Max 10 mints per day per address
            </strong>
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle>Enter your wallet address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="0x..."
                value={address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
              />

              <Button onClick={requestFaucet} disabled={isSubmitting || !address} className="w-full">
                {isSubmitting ? 'Requesting...' : 'Request 1,000 USDT'}
              </Button>

              {txHash && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Mint transaction submitted</p>
                  <Link href={`${BASESCAN_BASE_URL}/tx/${txHash}`} target="_blank" className="text-primary hover:underline">
                    View on BaseScan
                  </Link>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-sm text-muted-foreground">Token info (add to wallet):</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Address: <Link href={`${BASESCAN_BASE_URL}/token/${MOCK_USDT_ADDRESS}`} target="_blank" className="text-primary hover:underline">{MOCK_USDT_ADDRESS}</Link></li>
                  <li>Symbol: USDT</li>
                  <li>Decimals: 6</li>
                  <li>Network: Base Sepolia</li>
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      // @ts-ignore
                      await (window as any).ethereum?.request?.({
                        method: 'wallet_watchAsset',
                        params: {
                          type: 'ERC20',
                          options: {
                            address: MOCK_USDT_ADDRESS,
                            symbol: 'USDT',
                            decimals: 6,
                          },
                        },
                      })
                    } catch {}
                  }}
                >
                  Add USDT to Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


