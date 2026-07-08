import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {
  mainnet,
  bsc,
  polygon,
  arbitrum,
  optimism,
  base,
  avalanche,
} from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import type { AppKitNetwork } from '@reown/appkit-common'
import { APPKIT_THEME_VARIABLES } from './appkitTheme'

// Get projectId from https://dashboard.reown.com (formerly WalletConnect Cloud)
const projectId =
  import.meta.env.VITE_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694'

/** Primary chain for Connect Wallet + landing AI agent (EVA is Base-first). */
export const DEFAULT_WALLET_NETWORK = base

// NOTE: this whole file runs at MODULE LOAD (main.tsx imports it before React
// mounts). A throw here = white screen with no recovery. So: never throw at
// import time — warn instead, and wrap the side-effectful createAppKit() in
// try/catch so a wallet-init failure degrades (no modal) instead of killing
// the entire app.
if (!import.meta.env.VITE_REOWN_PROJECT_ID) {
  console.warn(
    '[wallet] VITE_REOWN_PROJECT_ID not set — using shared fallback projectId. Set your own in .env for production.'
  )
}

const metadata = {
  name: 'EVA',
  description: 'AI Wallet Analyzer & Trading on Base',
  url:
    typeof window !== 'undefined' ? window.location.origin : 'https://eva.com',
  icons: ['/logo.png'],
}

// EVM only — Base first. No Solana adapter/network in Reown.
const networks = [
  base,
  mainnet,
  arbitrum,
  optimism,
  polygon,
  bsc,
  avalanche,
] as [AppKitNetwork, ...AppKitNetwork[]]

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
})

export const queryClient = new QueryClient()

const METAMASK_WALLET_ID =
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'
const COINBASE_WALLET_ID = '4622a2b2d6af1c98449443d880a9297d1175f1d5'

// createAppKit registers the wallet modal as a global side effect. If it throws
// (bad projectId, network, DOM API), we must NOT let it blank the app — the
// rest of the site works fine without the wallet modal.
try {
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    defaultNetwork: DEFAULT_WALLET_NETWORK,
    projectId,
    metadata,
    themeMode: 'dark',
    allowUnsupportedChain: true,
    themeVariables: APPKIT_THEME_VARIABLES,
    // External wallets only — no email / X / Discord embedded-wallet auth.
    defaultAccountTypes: { eip155: 'eoa' },
    coinbasePreference: 'eoaOnly',
    featuredWalletIds: [METAMASK_WALLET_ID, COINBASE_WALLET_ID],
    includeWalletIds: [METAMASK_WALLET_ID, COINBASE_WALLET_ID],
    features: {
      analytics: false,
      email: false,
      socials: false,
      onramp: false,
      swaps: false,
      history: false,
      connectMethodsOrder: ['wallet'],
    },
  })
} catch (err) {
  console.error(
    '[wallet] createAppKit failed — wallet modal disabled, app continues:',
    err
  )
}

export { wagmiAdapter }
