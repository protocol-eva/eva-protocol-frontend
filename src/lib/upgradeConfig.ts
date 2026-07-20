export const UPGRADE_MIN_EVA_BALANCE = 150_000

/** Robinhood Chain — EVA launch network. */
export const EVA_BASE_CHAIN_ID = 4663 as const

/** EVA ERC-20 on Robinhood Chain. */
export const EVA_BASE_TOKEN_ADDRESS: string =
  '0x6e94eda608eec1f30cd9add9d4f5f28d25903334'

export const EVA_TOKEN_EXPLORER_URL =
  `https://robinhoodchain.blockscout.com/token/${EVA_BASE_TOKEN_ADDRESS}` as const

export const UPGRADE_SUPPORTED_CHAINS = [
  { id: '4663', label: 'Robinhood' },
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
