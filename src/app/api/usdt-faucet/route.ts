import { NextRequest } from 'next/server'
import { Address, Hex, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from '@reown/appkit/networks'
import { MockUSDTAbi, MOCK_USDT_ADDRESS } from '@/lib/abi/MockUSDT'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { to?: string }
    const to = (body?.to || '').trim() as Address
    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing recipient address' }), { status: 400 })
    }
    // Simple per-address daily rate limit: max 10/day per IP+address using cookie key
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    const today = new Date().toISOString().slice(0, 10)
    const key = `faucet_${ip}_${to}_${today}`
    const priorHeader = req.headers.get('cookie') || ''
    const priorMatch = priorHeader.match(new RegExp(`${key}=([0-9]+)`))
    const count = priorMatch ? parseInt(priorMatch[1], 10) : 0
    if (count >= 10) {
      return new Response(JSON.stringify({ error: 'Daily limit reached (10 mints/day)' }), { status: 429 })
    }

    const pk = process.env.FAUCET_OWNER_KEY as Hex | undefined
    if (!pk) {
      return new Response(JSON.stringify({ error: 'FAUCET_OWNER_KEY not configured' }), { status: 500 })
    }

    const account = privateKeyToAccount(pk)
    const client = createWalletClient({ chain: baseSepolia, transport: http(), account })

    const hash = await client.writeContract({
      address: MOCK_USDT_ADDRESS as Address,
      abi: MockUSDTAbi as any,
      functionName: 'mint',
      args: [to],
    })

    const newCount = count + 1
    const resBody = JSON.stringify({ txHash: hash, count: newCount, limit: 10 })
    const cookie = `${key}=${newCount}; Path=/; Max-Age=86400; SameSite=Lax`
    return new Response(resBody, { status: 200, headers: { 'set-cookie': cookie } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Mint failed' }), { status: 500 })
  }
}


