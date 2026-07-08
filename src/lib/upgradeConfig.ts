export const UPGRADE_MIN_EVA_BALANCE = 150_000

/** Base mainnet — EVA launch chain. */
export const EVA_BASE_CHAIN_ID = 8453 as const

/**
 * Fill this in once the EVA ERC-20 is live on Base mainnet.
 * Leave as `TBA` until the contract is deployed.
 */
export const EVA_BASE_TOKEN_ADDRESS: string = 'TBA'

export const UPGRADE_SUPPORTED_CHAINS = [
  { id: '8453', label: 'Base' },
  { id: '1', label: 'Ethereum' },
  { id: '56', label: 'BNB Chain' },
  { id: '137', label: 'Polygon' },
  { id: '42161', label: 'Arbitrum' },
  { id: '10', label: 'Optimism' },
  { id: '43114', label: 'Avalanche' },
] as const

export function isEvaTokenConfigured(): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(EVA_BASE_TOKEN_ADDRESS)
}
