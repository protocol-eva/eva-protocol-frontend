import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Activity03Icon } from '@hugeicons/core-free-icons'
import { OFFICIAL_LINKS } from '../constants/branding'
import { useLanguage } from '../contexts/LanguageContext'
import { goTo } from '../lib/nav'
import { StaticMetalBar } from './StaticMetalBar'

const FEATURES = [
  'Multi-exchange connectivity',
  'AI model integration',
  'Real-time market analytics',
  'Secure 2FA authentication',
  'Strategy marketplace',
]

interface WhitelistFullPageProps {
  onBack?: () => void
}

export function WhitelistFullPage({ onBack }: WhitelistFullPageProps) {
  const { language } = useLanguage()
  const isEn = language !== 'zh'

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      goTo('/login')
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: '#04050A' }}
    >
      <aside
        className="hidden fixed left-0 top-0 h-screen w-[500px] z-20 flex-col overflow-hidden gl-edge-glow"
        style={{
          background:
            'linear-gradient(160deg, #0C0D15 0%, #07080E 55%, #0A1022 100%)',
        }}
      >
        <img
          src="/login-poster.png"
          alt=""
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ transform: 'scale(1.06)', transformOrigin: 'center' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,8,14,0.55) 0%, rgba(6,8,14,0.28) 42%, rgba(6,8,14,0.82) 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3 mb-16">
            <span className="font-bold text-xl" style={{ color: '#00c853' }}>
              /
            </span>
            <span className="text-white font-bold tracking-[0.22em] text-sm">
              EVA PROTOCOL
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-5xl xl:text-[3.5rem] font-black leading-[0.88] tracking-tighter mb-7 gl-title-metal">
              BETA
              <br />
              <span className="gl-title-metal-blue">ACCESS</span>
              <br />
              ONLY
            </h2>
            <p
              className="text-[13px] font-mono leading-relaxed mb-12"
              style={{ color: 'rgba(255,255,255,0.86)' }}
            >
              {isEn ? (
                <>
                  Platform capacity is limited during the
                  <br />
                  current rollout phase.
                </>
              ) : (
                <>
                  当前阶段平台容量有限，
                  <br />
                  访问权限分批开放。
                </>
              )}
            </p>

            <div className="space-y-3.5">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{
                      background: '#00c853',
                      boxShadow: '0 0 5px rgba(61,107,255,0.9)',
                    }}
                  />
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: '#fff' }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex items-center gap-2 pt-6"
            style={{ borderTop: '1px solid rgba(61,107,255,0.18)' }}
          >
            <HugeiconsIcon
              icon={Activity03Icon}
              size={15}
              strokeWidth={2}
              className="animate-pulse"
              style={{
                color: '#86efac',
                filter: 'drop-shadow(0 0 6px rgba(61,107,255,0.85))',
              }}
            />
            <span
              className="text-[10px] font-mono tracking-widest"
              style={{ color: '#fff' }}
            >
              {isEn ? 'CAPACITY LIMIT REACHED' : '容量已达上限'}
            </span>
          </div>
        </div>
      </aside>

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm xl:max-w-md">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest mb-10 transition-opacity hover:opacity-60"
              style={{ color: 'rgba(255,255,255,0.66)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isEn ? 'BACK TO HOME' : '返回首页'}
            </a>

            <div className="rounded-2xl">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: '#0d0d0d',
                  border: '1px solid #1f1f1f',
                }}
              >
                <div className="p-7 sm:p-9">
                  <div className="mb-8">
                    <p
                      className="text-[10px] font-mono font-bold tracking-[0.25em] mb-2.5"
                      style={{ color: '#00c853', opacity: 0.8 }}
                    >
                      {isEn ? 'REGISTRATION UNAVAILABLE' : '无法注册'}
                    </p>
                    <h1 className="text-[1.6rem] font-bold mb-1 tracking-tight text-white">
                      {isEn ? 'Registration closed' : '注册暂不可用'}
                    </h1>
                    <p
                      className="text-[13px]"
                      style={{ color: 'rgba(255,255,255,0.38)' }}
                    >
                      {isEn
                        ? 'New signups are not available right now.'
                        : '当前暂不接受新用户注册。'}
                    </p>
                  </div>

                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.22)',
                    }}
                  >
                    <ShieldAlert
                      className="w-7 h-7"
                      style={{ color: '#f87171' }}
                    />
                  </div>

                  <p
                    className="text-[13px] leading-relaxed mb-6 text-center"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {isEn
                      ? 'Registration may be temporarily disabled or the server has reached its configured user limit. Try again later or contact support.'
                      : '注册可能暂时关闭，或服务器已达到用户上限。请稍后再试或通过 Telegram 联系支持。'}
                  </p>

                  <div
                    className="rounded-xl p-4 mb-8"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <p
                      className="text-[11px] font-mono font-bold tracking-wider mb-2"
                      style={{ color: '#00c853', opacity: 0.75 }}
                    >
                      {isEn ? 'WHAT YOU CAN DO' : '您可以'}
                    </p>
                    <p
                      className="text-[13px] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.42)' }}
                    >
                      {isEn
                        ? 'Access is rolled out in batches. Follow updates for the next wave, or reach out on Telegram if you believe this is an error.'
                        : '访问权限将分批开放。请关注官方动态获取下一批名额，如有疑问可通过 Telegram 联系团队。'}
                    </p>
                  </div>

                  <div className="flex justify-center mb-6">
                    <StaticMetalBar type="button" onClick={handleBack}>
                      {onBack
                        ? isEn
                          ? 'Back to registration'
                          : '返回注册'
                        : isEn
                          ? 'Return to login'
                          : '返回登录'}
                    </StaticMetalBar>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={OFFICIAL_LINKS.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-mono font-semibold tracking-wider transition-all hover:opacity-80"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.62)',
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      {isEn ? 'Updates' : '动态'}
                    </a>
                    <a
                      href={OFFICIAL_LINKS.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-mono font-semibold tracking-wider transition-all hover:opacity-80"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.62)',
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                      {isEn ? 'Support' : '支持'}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 text-center">
              <p
                className="text-[11px] font-mono tracking-wider"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                {isEn
                  ? 'ERR_CODE: REG_UNAVAILABLE'
                  : '错误码: REG_UNAVAILABLE'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
