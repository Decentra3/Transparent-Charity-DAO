import { Address, erc20Abi, formatUnits, parseUnits } from 'viem'
import { readContract, writeContract, waitForTransactionReceipt, getChainId } from 'wagmi/actions'
import { config } from '@/config'
import { DonationDAOAbi } from '@/lib/abi/DonationDAO'
import { DONATION_DAO_ADDRESS, USDT_ADDRESS, BASE_SEPOLIA_CHAIN_ID } from '@/lib/contract-config'

export { DONATION_DAO_ADDRESS, USDT_ADDRESS, BASE_SEPOLIA_CHAIN_ID, BASESCAN_BASE_URL } from '@/lib/contract-config'

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

export async function donateToProject(projectId: string, amount: string) {
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

export async function closeProjectOnChain(projectId: string) {
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


export async function voteOnRequest(requestId: string, decision: boolean) {
  await ensureBaseSepolia()
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'vote',
    args: [requestId, decision],
  })
  await waitForTransactionReceipt(config, { hash })
  return { hash }
}

export async function voteOnProjectOnChain(projectId: string, decision: boolean) {
  await ensureBaseSepolia()
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'voteOnProject',
    args: [projectId, decision],
  })
  await waitForTransactionReceipt(config, { hash })
  return { hash }
}

export async function createRequestFund(requestId: string, amount: string, description: string, proofHash: string, aiQuorumPercent: number = 50) {
  await ensureBaseSepolia()
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'createRequest',
    args: [requestId, parseUnits(amount, 6), description, proofHash, BigInt(Math.max(50, Math.min(100, aiQuorumPercent)))],
  })
  await waitForTransactionReceipt(config, { hash })
  return { hash }
}

export async function createProjectOnChain(projectId: string, title: string, description: string, proofHash: string, targetAmount: string, durationDays: number, aiQuorumPercent: number = 50) {
  await ensureBaseSepolia()
  const nowSec = Math.floor(Date.now() / 1000)
  const deadline = BigInt(nowSec + Math.max(7, Math.min(365, durationDays)) * 24 * 60 * 60)
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'createProject',
    args: [projectId, title, description, proofHash, parseUnits(targetAmount, 6), deadline, BigInt(Math.max(50, Math.min(100, aiQuorumPercent)))],
  })
  await waitForTransactionReceipt(config, { hash })
  return { hash }
}

export async function donorVoteOnRequest(requestId: string, decision: boolean) {
  await ensureBaseSepolia()
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'donorVoteOnRequest',
    args: [requestId, decision],
  })
  await waitForTransactionReceipt(config, { hash })
  return { hash }
}

export async function finalizeRequestByDonors(requestId: string) {
  await ensureBaseSepolia()
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'finalizeRequestByDonors',
    args: [requestId],
  })
  await waitForTransactionReceipt(config, { hash })
  return { hash }
}

export async function closeApprovedRequest(requestId: string) {
  await ensureBaseSepolia()
  const hash = await writeContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'closeApprovedRequest',
    args: [requestId],
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
export async function getRequestById(requestId: string) {
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

export async function getProjectById(projectId: string) {
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

export async function getDaoMembers(): Promise<string[]> {
  await ensureBaseSepolia()
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getDaoMembers',
    args: [],
  })
  return res as string[]
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

export async function getDaoReputation(addressToCheck: Address | string): Promise<number> {
  await ensureBaseSepolia()
  const rep = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'daoReputation',
    args: [addressToCheck as Address],
  })
  return Number(rep)
}

export async function getDonorFlags(addressToCheck: Address | string) {
  await ensureBaseSepolia()
  const [isDonor, hasSbt, total] = await Promise.all([
    readContract(config, { abi: DonationDAOAbi as any, address: DONATION_DAO_ADDRESS as Address, functionName: 'isDonor', args: [addressToCheck as Address] }),
    readContract(config, { abi: DonationDAOAbi as any, address: DONATION_DAO_ADDRESS as Address, functionName: 'hasDonorSbt', args: [addressToCheck as Address] }),
    readContract(config, { abi: DonationDAOAbi as any, address: DONATION_DAO_ADDRESS as Address, functionName: 'totalFundDonated', args: [addressToCheck as Address] }),
  ])
  return { isDonor: Boolean(isDonor), hasSbt: Boolean(hasSbt), totalFundDonated: formatUnits(total as bigint, 6) }
}

export function pickAiQuorumPercent(): number {
  // Temporary AI placeholder: pick random 50..100 with bias to 50
  const r = Math.random()
  if (r < 0.6) return 50
  return Math.min(100, 50 + Math.floor(Math.random() * 51))
}

// Get DAO members with reputation
export async function getDaoMembersWithReputation() {
  await ensureBaseSepolia()
  const res = await readContract(config, {
    abi: DonationDAOAbi as any,
    address: DONATION_DAO_ADDRESS as Address,
    functionName: 'getDaoMembersWithReputation',
    args: [],
  })
  return res as any[]
}

// Get pending votes with role information
export async function getPendingVotesWithRole(voterAddress: string) {
  await ensureBaseSepolia()
  
  // Check if user is DAO member
  const isDaoMember = await isDaoMemberAddress(voterAddress)
  
  // Check if user is donor
  const donorFlags = await getDonorFlags(voterAddress)
  const isDonor = donorFlags.isDonor || donorFlags.hasSbt || Number(donorFlags.totalFundDonated) > 0
  
  // Get pending votes
  const votes = await getPendingVotesFor(voterAddress)
  
  // Add role information to each vote
  const votesWithRole = votes.map((vote: any) => ({
    ...vote,
    canVoteAsDao: isDaoMember,
    canVoteAsDonor: isDonor,
    userRole: isDaoMember ? 'dao_member' : (isDonor ? 'donor' : 'none')
  }))
  
  return votesWithRole
}