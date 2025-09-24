import { Address, erc20Abi, formatUnits, parseUnits } from 'viem'
import { readContract, writeContract, waitForTransactionReceipt, getChainId } from 'wagmi/actions'
import { config } from '@/config'
import { DonationDAOAbi, DONATION_DAO_ADDRESS, USDT_ADDRESS } from '@/lib/abi/DonationDAO'
export { DONATION_DAO_ADDRESS } from '@/lib/abi/DonationDAO'

export const BASE_SEPOLIA_CHAIN_ID = 84532
export const BASESCAN_BASE_URL = 'https://sepolia.basescan.org'

export async function ensureBaseSepolia(): Promise<void> {
  const current = await getChainId(config)
  if (current !== BASE_SEPOLIA_CHAIN_ID) {
    throw new Error('Please switch network to Base Sepolia in your wallet')
  }
}

export async function getFundBalance(): Promise<string> {
  await ensureBaseSepolia()
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getFundBalance',
    args: [],
  })
  return formatUnits(res as bigint, 6)
}

export async function getDashboardStats() {
  await ensureBaseSepolia()
  const [fund, disbursed, projectsVoting, allProjects] = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getDashboardStats',
    args: [],
  }) as unknown as [bigint, bigint, bigint, bigint]

  return {
    fund: formatUnits(fund, 6),
    disbursed: formatUnits(disbursed, 6),
    projectsVoting: Number(projectsVoting),
    allProjects: Number(allProjects),
  }
}

export async function getRequestCounts() {
  await ensureBaseSepolia()
  const [total, pending, disbursed, rejected] = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getRequestCounts',
    args: [],
  }) as unknown as [bigint, bigint, bigint, bigint]

  return {
    total: Number(total),
    pending: Number(pending),
    disbursed: Number(disbursed),
    rejected: Number(rejected),
  }
}

export async function getProjectCounts() {
  await ensureBaseSepolia()
  const [total, voting, active, closed, rejected] = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getProjectCounts',
    args: [],
  }) as unknown as [bigint, bigint, bigint, bigint, bigint]

  return {
    total: Number(total),
    voting: Number(voting),
    active: Number(active),
    closed: Number(closed),
    rejected: Number(rejected),
  }
}

// get all crowdfunding
export async function getAllProjects() {
  await ensureBaseSepolia()
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getAllProjects',
    args: [],
  })
  return res as any[]
}

// get all request fund
export async function getAllRequests() {
  await ensureBaseSepolia()
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getAllRequests',
    args: [],
  })
  return res as any[]
}

// get pending votes for a specific voter
export async function getPendingVotesFor(voterAddress: string) {
  await ensureBaseSepolia()
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getPendingVotesFor',
    args: [voterAddress as Address],
  })
  return res as any[]
}

// get all request fund and crowdfunding 
export async function getActivities() { 
  await ensureBaseSepolia()
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getActivities',
    args: [],
  })
  // console.log('getActivities raw response:', res)
  // console.log('getActivities type:', typeof res)
  // console.log('getActivities length:', Array.isArray(res) ? res.length : 'not array')
  
  if (Array.isArray(res)) {
    res.forEach((item, index) => {
      // console.log(`Activity ${index}:`, item)
      // console.log(`Activity ${index} type:`, typeof item)
      // console.log(`Activity ${index} keys:`, Object.keys(item || {}))
    })
  }
  
  return res as any[]
}

export async function approveUSDT(spender: Address, amount: string) {
  await ensureBaseSepolia()
  const hash = await writeContract(config, {
    abi: erc20Abi,
    address: USDT_ADDRESS as Address,
    functionName: 'approve',
    args: [spender, parseUnits(amount, 6)],
  })
  await waitForTransactionReceipt(config, { hash })
  return hash
}

export async function donateToFund(amount: string) {
  await ensureBaseSepolia()
  const approveHash = await approveUSDT(DONATION_DAO_ADDRESS as Address, amount)
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'donate',
    args: [parseUnits(amount, 6)],
  })
  await waitForTransactionReceipt(config, { hash })
  return { approveHash, hash }
}

export async function donateToProject(projectId: bigint, amount: string) {
  await ensureBaseSepolia()
  const approveHash = await approveUSDT(DONATION_DAO_ADDRESS as Address, amount)
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'donateToProject',
    args: [projectId, parseUnits(amount, 6)],
  })
  await waitForTransactionReceipt(config, { hash })
  return { approveHash, hash }
}

export async function closeProjectOnChain(projectId: bigint) {
  await ensureBaseSepolia()
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'closeProject',
    args: [projectId],
  })
  await waitForTransactionReceipt(config, { hash })
  return { hash }
}


export async function createRequestFund(amount: string, description: string, proofHash: string) {
  await ensureBaseSepolia()
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'createRequest',
    args: [parseUnits(amount, 6), description, proofHash],
  })
  await waitForTransactionReceipt(config, { hash })
  return { hash }
}

export async function createProjectOnChain(title: string, description: string, proofHash: string, targetAmount: string, durationDays: number) {
  await ensureBaseSepolia()
  const nowSec = Math.floor(Date.now() / 1000)
  const deadline = BigInt(nowSec + Math.max(7, Math.min(365, durationDays)) * 24 * 60 * 60)
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'createProject',
    args: [title, description, proofHash, parseUnits(targetAmount, 6), deadline],
  })
  await waitForTransactionReceipt(config, { hash })
  return { hash }
}

export async function getLatestContractEvents(limit: number = 5) {
  await ensureBaseSepolia()
  
  // For now, return empty array - we'll implement this later with proper event fetching
  // This is a placeholder function that can be enhanced later
  console.log('getLatestContractEvents called with limit:', limit)
  return []
}



// ------- NEW: Detail readers to support pages showing full data (including proofHash) -------
export async function getRequestById(requestId: bigint) {
  await ensureBaseSepolia()
  console.log('[contract] getRequestById', requestId)
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getRequestById',
    args: [requestId],
  })
  console.log('[contract] getRequestById result:', res)
  return res as any
}

export async function getProjectById(projectId: bigint) {
  await ensureBaseSepolia()
  console.log('[contract] getProjectById', projectId)
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getProjectById',
    args: [projectId],
  })
  console.log('[contract] getProjectById result:', res)
  return res as any
}

export async function getDaoMemberCount() {
  await ensureBaseSepolia()
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'daoMemberCount',
    args: [],
  })
  return res as bigint
}

// Get full DAO member list
// Prefer request mapping check to avoid needing full member list ABI
export async function isDaoMemberAddress(addressToCheck?: Address | string | null): Promise<boolean> {
  await ensureBaseSepolia()
  try {
    if (!addressToCheck) return false
    const res = await readContract(config, {
      abi: DonationDAOAbi as any,
      address: DONATION_DAO_ADDRESS as Address,
      functionName: 'daoMembers',
      args: [addressToCheck as Address],
    })
    console.log('[contract] daoMembers(', addressToCheck, ') =', res)
    return Boolean(res)
  } catch (e) {
    console.warn('[contract] isDaoMemberAddress error:', e)
    return false
  }
}