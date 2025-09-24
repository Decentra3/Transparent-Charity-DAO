export const MOCK_USDT_ADDRESS = '0x2c97BC95cd2De8bD217a7c4dFeC4CC4eC0179906'

export const MockUSDTAbi = [
  { type: 'function', stateMutability: 'view', name: 'name', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { type: 'function', stateMutability: 'view', name: 'symbol', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { type: 'function', stateMutability: 'pure', name: 'decimals', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
  { type: 'function', stateMutability: 'nonpayable', name: 'mint', inputs: [ { name: 'to', type: 'address' } ], outputs: [] },
  { type: 'function', stateMutability: 'view', name: 'balanceOf', inputs: [ { name: 'account', type: 'address' } ], outputs: [{ name: '', type: 'uint256' }] }
] as const


