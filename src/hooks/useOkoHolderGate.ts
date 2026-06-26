import { useEffect, useMemo, useState } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import {
  UPGRADE_MIN_EVA_BALANCE,
  EVA_SOLANA_MINT,
  isSolanaMintConfigured,
} from '../lib/upgradeConfig'

const SOLANA_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.rpc.extrnode.com',
  'https://rpc.ankr.com/solana',
]

async function fetchSolanaTokenBalance(
  ownerAddress: string,
  mintAddress: string
): Promise<number> {
  const isSolanaAddr =
    !ownerAddress.startsWith('0x') && ownerAddress.length >= 32
  if (!isSolanaAddr) {
    throw new Error('Non-base58 character')
  }

  let lastError: unknown
  for (const endpoint of SOLANA_RPC_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [
            ownerAddress,
            { mint: mintAddress },
            { encoding: 'jsonParsed' },
          ],
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message || 'RPC error')
      let total = 0
      for (const account of json.result?.value ?? []) {
        const uiAmount =
          account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount
        if (typeof uiAmount === 'number') total += uiAmount
      }
      return total
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

type GateStatus =
  | 'disconnected'
  | 'unconfigured'
  | 'checking'
  | 'eligible'
  | 'ineligible'
  | 'error'

export interface OkoHolderGateState {
  status: GateStatus
  address?: string
  threshold: number
  totalBalance: number
  missingBalance: number
  deploymentsChecked: number
  error?: string
  isConnected: boolean
  isEligible: boolean
}

export function useOkoHolderGate(): OkoHolderGateState {
  const { address, isConnected } = useAppKitAccount()
  const previewMode =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('upgradePreview')
      : null
  const [state, setState] = useState<
    Omit<OkoHolderGateState, 'address' | 'isConnected' | 'isEligible'>
  >({
    status: isConnected ? 'checking' : 'disconnected',
    threshold: UPGRADE_MIN_EVA_BALANCE,
    totalBalance: 0,
    missingBalance: UPGRADE_MIN_EVA_BALANCE,
    deploymentsChecked: 0,
  })

  useEffect(() => {
    if (!isConnected || !address) {
      setState({
        status: 'disconnected',
        threshold: UPGRADE_MIN_EVA_BALANCE,
        totalBalance: 0,
        missingBalance: UPGRADE_MIN_EVA_BALANCE,
        deploymentsChecked: isSolanaMintConfigured() ? 1 : 0,
      })
      return
    }
    if (!isSolanaMintConfigured()) {
      if (previewMode === 'eligible' || previewMode === 'ineligible') {
        const totalBalance =
          previewMode === 'eligible'
            ? UPGRADE_MIN_EVA_BALANCE
            : UPGRADE_MIN_EVA_BALANCE / 3
        setState({
          status: previewMode === 'eligible' ? 'eligible' : 'ineligible',
          threshold: UPGRADE_MIN_EVA_BALANCE,
          totalBalance,
          missingBalance: Math.max(0, UPGRADE_MIN_EVA_BALANCE - totalBalance),
          deploymentsChecked: 0,
        })
        return
      }
      setState({
        status: 'unconfigured',
        threshold: UPGRADE_MIN_EVA_BALANCE,
        totalBalance: 0,
        missingBalance: UPGRADE_MIN_EVA_BALANCE,
        deploymentsChecked: 0,
      })
      return
    }

    let cancelled = false
    setState((prev) => ({
      ...prev,
      status: 'checking',
      threshold: UPGRADE_MIN_EVA_BALANCE,
      deploymentsChecked: 1,
      error: undefined,
    }))
    ;(async () => {
      try {
        const totalBalance = await fetchSolanaTokenBalance(
          address,
          EVA_SOLANA_MINT
        )

        if (cancelled) return
        const isEligible = totalBalance >= UPGRADE_MIN_EVA_BALANCE
        setState({
          status: isEligible ? 'eligible' : 'ineligible',
          threshold: UPGRADE_MIN_EVA_BALANCE,
          totalBalance,
          missingBalance: Math.max(0, UPGRADE_MIN_EVA_BALANCE - totalBalance),
          deploymentsChecked: 1,
        })
      } catch (error) {
        if (cancelled) return
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to read EVA Solana balances'
        const friendlyMessage =
          message.includes('Non-base58 character') ||
          message.includes('Invalid public key')
            ? 'Connected wallet is not a valid Solana address. Connect the Solana wallet that holds your EVA.'
            : message
        setState({
          status: 'error',
          threshold: UPGRADE_MIN_EVA_BALANCE,
          totalBalance: 0,
          missingBalance: UPGRADE_MIN_EVA_BALANCE,
          deploymentsChecked: 1,
          error: friendlyMessage,
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [address, isConnected, previewMode])

  return useMemo(
    () => ({
      ...state,
      address,
      isConnected,
      isEligible: state.status === 'eligible',
    }),
    [address, isConnected, state]
  )
}
