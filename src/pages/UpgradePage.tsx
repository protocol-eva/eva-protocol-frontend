import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'
import { useAppKit } from '@reown/appkit/react'
import HeaderBar from '../components/HeaderBar'
import { LiquidBackdrop } from '../components/LiquidBackdrop'
import { goTo } from '../lib/nav'
import { UpgradeDeepThinkPanel } from '../components/UpgradeDeepThinkPanel'
import { UpgradeWhitelistPanel } from '../components/UpgradeWhitelistPanel'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useOkoHolderGate } from '../hooks/useOkoHolderGate'
import { EVA_SOLANA_MINT, isSolanaMintConfigured } from '../lib/upgradeConfig'
import {
  getWhitelistEntries,
  type WhitelistEntry,
} from '../lib/upgradeWhitelist'

export function UpgradePage() {
  const { open } = useAppKit()
  const { language } = useLanguage()
  const { user, token, logout } = useAuth()
  const gate = useOkoHolderGate()
  const [whitelistOpen, setWhitelistOpen] = useState(false)
  const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>([])
  const isEn = language !== 'zh'
  const mintConfigured = useMemo(() => isSolanaMintConfigured(), [])

  useEffect(() => {
    getWhitelistEntries()
      .then(setWhitelistEntries)
      .catch(() => setWhitelistEntries([]))
  }, [])

  const navigate = (path: string) => goTo(path) // SPA nav (no full reload)

  const progressPct = Math.min(
    100,
    gate.threshold > 0 ? (gate.totalBalance / gate.threshold) * 100 : 0
  )

  const gateHeadline =
    gate.status === 'eligible'
      ? isEn
        ? 'Upgrade unlocked'
        : '升级已解锁'
      : gate.status === 'unconfigured'
        ? isEn
          ? 'Token gate pending contract launch'
          : '代币门槛等待合约上线'
        : gate.status === 'error'
          ? isEn
            ? 'Unable to verify EVA balance'
            : '无法验证 EVA 余额'
          : gate.status === 'checking'
            ? isEn
              ? 'Checking EVA balance…'
              : '正在检查 EVA 余额…'
            : gate.status === 'disconnected'
              ? isEn
                ? 'Connect a wallet to check eligibility'
                : '连接钱包以检查资格'
              : isEn
                ? 'Need more EVA to unlock'
                : '需要更多 EVA 才能解锁'

  const gateSubcopy =
    gate.status === 'unconfigured'
      ? isEn
        ? 'The holder gate is ready, but the EVA Solana mint has not been configured yet. Once the mint is live, this page will verify balances on Solana without using Squid.'
        : '持币门槛逻辑已准备好，但 EVA 的 Solana mint 尚未配置。代币上线后，本页将直接在 Solana 上校验余额，而不会使用 Squid。'
      : gate.status === 'error'
        ? isEn
          ? gate.error ||
            'The app could not read your Solana EVA balance. Make sure the connected wallet is your Solana wallet, then try again.'
          : gate.error ||
            '应用无法读取您的 Solana EVA 余额。请确认当前连接的是持有 EVA 的 Solana 钱包，然后重试。'
        : gate.status === 'eligible'
          ? isEn
            ? 'Your connected wallet qualifies for the Upgrade feature set.'
            : '您当前连接的钱包符合 Upgrade 功能资格。'
          : isEn
            ? 'Holders of 150,000 EVA gain advanced bridge, assistant, and whitelist capabilities.'
            : '持有 150,000 EVA 的用户将获得高级桥接、助手与白名单能力。'

  return (
    <div
      className="min-h-screen relative gl-data-page"
      style={{ color: 'var(--text-primary)' }}
    >
      <LiquidBackdrop />
      <HeaderBar
        isLoggedIn={!!(user && token)}
        currentPage="upgrade"
        language={language}
        onLanguageChange={() => {}}
        user={user}
        onLogout={logout}
        onLoginRequired={() => {}}
        onPageChange={(page) => navigate(`/${page}`)}
      />

      <main className="pt-16 relative z-10">
        <section className="relative overflow-hidden px-4 py-20 sm:py-28">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 50% 32% at 50% 2%, rgba(61,107,255,0.09) 0%, transparent 58%)',
            }}
          />

          <div className="max-w-6xl mx-auto relative z-10 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-3xl"
            >
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight whitespace-nowrap"
                style={{ letterSpacing: '-0.04em' }}
              >
                {isEn ? (
                  <>
                    Upgrade unlocks the next layer of{' '}
                    <span className="eva-shimmer">EVA</span>
                  </>
                ) : (
                  <>
                    Upgrade 解锁 <span className="eva-shimmer">EVA</span>{' '}
                    的下一层能力
                  </>
                )}
              </h1>
              <p
                className="text-lg mt-5 leading-relaxed whitespace-nowrap"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isEn
                  ? 'Supporters holding 150,000 EVA gain access to cross-chain execution and Deep Think wallet assistance.'
                  : '持有 150,000 EVA 的支持者将获得跨链执行与 Deep Think 钱包助手。'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="grid grid-cols-1 gap-6"
            >
              <div className="rounded-[28px] p-6 sm:p-7 overflow-hidden gl-metal-panel">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className="text-xs uppercase tracking-[0.24em] mb-2"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {isEn ? 'Eligibility' : '资格'}
                    </div>
                    <h2 className="text-2xl font-semibold gl-metal-text">
                      {gateHeadline}
                    </h2>
                  </div>
                  <div
                    className="rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
                    style={{
                      background: gate.isEligible
                        ? 'rgba(16,203,129,0.10)'
                        : 'rgba(255,255,255,0.035)',
                      border: `1px solid ${gate.isEligible ? 'rgba(16,203,129,0.30)' : 'rgba(255,255,255,0.10)'}`,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <span
                      className={`gl-gate-label${gate.isEligible ? ' gl-gate-label--unlocked' : ''}`}
                    >
                      {gate.isEligible
                        ? isEn
                          ? 'Eligible'
                          : '符合条件'
                        : isEn
                          ? 'Locked'
                          : '未解锁'}
                    </span>
                  </div>
                </div>

                <p
                  className="text-sm mt-3 leading-relaxed max-w-2xl"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {gateSubcopy}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <MetricCard
                    label={isEn ? 'Wallet' : '钱包'}
                    value={
                      gate.address
                        ? `${gate.address.slice(0, 6)}…${gate.address.slice(-4)}`
                        : '—'
                    }
                  />
                  <MetricCard
                    label={isEn ? 'Current EVA' : '当前 EVA'}
                    value={gate.totalBalance.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  />
                  <MetricCard
                    label={isEn ? 'Threshold' : '门槛'}
                    value={gate.threshold.toLocaleString()}
                  />
                </div>

                <div className="mt-5">
                  <div
                    className="flex items-center justify-between text-xs mb-2"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <span>{isEn ? 'Progress to unlock' : '距离解锁进度'}</span>
                    <span>{progressPct.toFixed(1)}%</span>
                  </div>
                  <div
                    className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressPct}%`,
                        background: gate.isEligible
                          ? 'linear-gradient(90deg, #0ea968, #10cb81)'
                          : 'linear-gradient(90deg, #2a54e6, #4f7bff)',
                        boxShadow: gate.isEligible
                          ? '0 0 12px rgba(16,203,129,0.5)'
                          : '0 0 12px rgba(61,107,255,0.5)',
                      }}
                    />
                  </div>
                  {!gate.isEligible && gate.status !== 'unconfigured' ? (
                    <div
                      className="text-xs mt-2"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {isEn
                        ? `${gate.missingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} EVA remaining to unlock.`
                        : `还需 ${gate.missingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} EVA 才能解锁。`}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-6">
                  {!gate.isConnected ? (
                    <button
                      onClick={() => open()}
                      className="rounded-2xl px-4 py-3 text-sm font-semibold inline-flex items-center gap-2 transition-all hover:brightness-110"
                      style={{
                        background:
                          'linear-gradient(180deg, #4f7bff 0%, #3d6bff 100%)',
                        color: '#fff',
                        boxShadow:
                          '0 4px 16px rgba(61,107,255,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
                      }}
                    >
                      <Wallet className="w-4 h-4" />
                      {isEn ? 'Connect wallet' : '连接钱包'}
                    </button>
                  ) : null}
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {mintConfigured
                      ? isEn
                        ? `Configured Solana mint: ${EVA_SOLANA_MINT.slice(0, 6)}…${EVA_SOLANA_MINT.slice(-4)}`
                        : `已配置 Solana mint：${EVA_SOLANA_MINT.slice(0, 6)}…${EVA_SOLANA_MINT.slice(-4)}`
                      : isEn
                        ? 'Solana mint not configured yet.'
                        : 'Solana mint 暂未配置。'}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14 }}
              className="grid grid-cols-1 gap-6"
            >
              <UpgradeDeepThinkPanel
                eligible={gate.isEligible}
                language={isEn ? 'en' : 'zh'}
                whitelistEntries={whitelistEntries}
                onOpenWhitelist={() => setWhitelistOpen(true)}
              />
            </motion.div>
          </div>
        </section>
      </main>

      <UpgradeWhitelistPanel
        open={whitelistOpen}
        onClose={() => setWhitelistOpen(false)}
        onEntriesChange={setWhitelistEntries}
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="rounded-2xl px-4 py-3 overflow-hidden gl-onyx-panel">
      <div
        className="text-[11px] uppercase tracking-[0.18em]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </div>
      <div
        className={`${compact ? 'text-sm' : 'text-lg'} font-semibold mt-2 break-words gl-metal-text`}
      >
        {value}
      </div>
    </div>
  )
}
