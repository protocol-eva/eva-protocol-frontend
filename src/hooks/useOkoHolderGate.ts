import { useEffect, useMemo, useState } from 'react'
import { createPublicClient, defineChain, formatUnits, http } from 'viem'
import { useAppKitAccount } from '@reown/appkit/react'
import {
  UPGRADE_MIN_EVA_BALANCE,
  EVA_BASE_TOKEN_ADDRESS,
  EVA_BASE_CHAIN_ID,
  isEvaTokenConfigured,
} from '../lib/upgradeConfig'

const robinhoodChain = defineChain({
  id: EVA_BASE_CHAIN_ID,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Explorer',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
})

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

async function fetchBaseTokenBalance(
  ownerAddress: string,
  tokenAddress: string
): Promise<number> {
  if (!ownerAddress.startsWith('0x')) {
    throw new Error('Non-EVM address')
  }

  const client = createPublicClient({
    chain: robinhoodChain,
    transport: http('https://rpc.mainnet.chain.robinhood.com'),
  })

  const [balance, decimals] = await Promise.all([
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [ownerAddress as `0x${string}`],
    }),
    client
      .readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      })
      .catch(() => 18),
  ])

  return Number(formatUnits(balance, decimals))
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
        deploymentsChecked: isEvaTokenConfigured() ? 1 : 0,
      })
      return
    }
    if (!isEvaTokenConfigured()) {
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
        const totalBalance = await fetchBaseTokenBalance(
          address,
          EVA_BASE_TOKEN_ADDRESS
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
            : 'Failed to read EVA Base balances'
        const friendlyMessage = message.includes('Non-EVM address')
          ? 'Connected wallet is not a valid EVM address. Connect the Base wallet that holds your EVA.'
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
