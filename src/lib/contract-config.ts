// Contract Configuration
// Update these addresses when deploying new contracts

export const CONTRACT_ADDRESSES = {
  // DonationDAO Contract
  DONATION_DAO: '0xfA18c4E9a57A13E078b925bEeCb78A858C4e06CD',
  
  // USDT Token Contract (Base Sepolia)
  USDT: '0x2c97BC95cd2De8bD217a7c4dFeC4CC4eC0179906',
  
  // Network Configuration
  CHAIN_ID: 84532, // Base Sepolia
  RPC_URL: 'https://sepolia.base.org',
  BLOCK_EXPLORER_URL: 'https://sepolia.basescan.org'
} as const

// Export individual addresses for backward compatibility
export const DONATION_DAO_ADDRESS = CONTRACT_ADDRESSES.DONATION_DAO
export const USDT_ADDRESS = CONTRACT_ADDRESSES.USDT
export const BASE_SEPOLIA_CHAIN_ID = CONTRACT_ADDRESSES.CHAIN_ID
export const BASESCAN_BASE_URL = CONTRACT_ADDRESSES.BLOCK_EXPLORER_URL
