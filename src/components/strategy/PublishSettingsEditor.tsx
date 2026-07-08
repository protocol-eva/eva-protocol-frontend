import { HugeiconsIcon } from '@hugeicons/react'
import {
  Globe02Icon,
  SquareLock02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'

interface PublishSettingsEditorProps {
  isPublic: boolean
  configVisible: boolean
  onIsPublicChange: (value: boolean) => void
  onConfigVisibleChange: (value: boolean) => void
  disabled?: boolean
  language: string
}

export function PublishSettingsEditor({
  isPublic,
  configVisible,
  onIsPublicChange,
  onConfigVisibleChange,
  disabled = false,
  language,
}: PublishSettingsEditorProps) {
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      publishToMarket: { zh: '发布到策略市场', en: 'Publish to Market' },
      publishDesc: {
        zh: '策略将在市场公开展示，其他用户可发现并使用',
        en: 'Strategy will be publicly visible in the marketplace',
      },
      showConfig: { zh: '公开配置参数', en: 'Show Config' },
      showConfigDesc: {
        zh: '允许他人查看和复制详细配置',
        en: 'Allow others to view and clone config details',
      },
      private: { zh: '私有', en: 'PRIVATE' },
      public: { zh: '公开', en: 'PUBLIC' },
      hidden: { zh: '隐藏', en: 'HIDDEN' },
      visible: { zh: '可见', en: 'VISIBLE' },
    }
    return translations[key]?.[language] || key
  }

  return (
    <div className="space-y-3">
      {/* 发布开关 */}
      <div
        className={`gl-metal-panel relative overflow-hidden rounded-xl transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          boxShadow: isPublic
            ? '0 0 22px rgba(14, 203, 129, 0.18), inset 0 1px 0 rgba(255,255,255,0.05)'
            : undefined,
          borderColor: isPublic ? 'rgba(14, 203, 129, 0.42)' : undefined,
        }}
        onClick={() => !disabled && onIsPublicChange(!isPublic)}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-0 w-full h-[1px] transition-opacity duration-300 pointer-events-none"
          style={{
            background: isPublic
              ? 'linear-gradient(90deg, transparent, var(--binance-green), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
            opacity: isPublic ? 1 : 0.6,
          }}
        />

        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="grid place-items-center h-10 w-10 shrink-0 rounded-xl transition-all duration-300"
              style={{
                background: isPublic
                  ? 'linear-gradient(160deg, rgba(14,203,129,0.26), rgba(14,203,129,0.08))'
                  : 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                border: isPublic
                  ? '1px solid rgba(14, 203, 129, 0.4)'
                  : '1px solid var(--panel-border)',
                boxShadow: isPublic
                  ? '0 0 14px rgba(14,203,129,0.3), inset 0 1px 0 rgba(255,255,255,0.12)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <HugeiconsIcon
                icon={isPublic ? Globe02Icon : SquareLock02Icon}
                size={20}
                strokeWidth={1.9}
                style={{
                  color: isPublic
                    ? 'var(--binance-green)'
                    : 'var(--text-secondary)',
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold gl-metal-text truncate">
                {t('publishToMarket')}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('publishDesc')}
              </div>
            </div>
          </div>

          {/* Toggle with status */}
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="text-[10px] font-mono font-bold tracking-wider tabular-nums"
              style={{
                color: isPublic
                  ? 'var(--binance-green)'
                  : 'var(--text-secondary)',
              }}
            >
              {isPublic ? t('public') : t('private')}
            </span>
            <button
              type="button"
              className="gl-switch"
              data-on={isPublic ? 'true' : 'false'}
              disabled={disabled}
              aria-pressed={isPublic}
              onClick={(e) => {
                e.stopPropagation()
                if (!disabled) onIsPublicChange(!isPublic)
              }}
            />
          </div>
        </div>
      </div>

      {/* 配置可见性开关 - 仅在公开时显示 */}
      {isPublic && (
        <div
          className={`gl-metal-panel relative overflow-hidden rounded-xl transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{
            boxShadow: configVisible
              ? '0 0 22px rgba(61, 107, 255, 0.18), inset 0 1px 0 rgba(255,255,255,0.05)'
              : undefined,
            borderColor: configVisible ? 'rgba(61, 107, 255, 0.42)' : undefined,
          }}
          onClick={() => !disabled && onConfigVisibleChange(!configVisible)}
        >
          {/* Top glow line */}
          <div
            className="absolute top-0 left-0 w-full h-[1px] transition-opacity duration-300 pointer-events-none"
            style={{
              background: configVisible
                ? 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
              opacity: configVisible ? 1 : 0.6,
            }}
          />

          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="grid place-items-center h-10 w-10 shrink-0 rounded-xl transition-all duration-300"
                style={{
                  background: configVisible
                    ? 'linear-gradient(160deg, rgba(61,107,255,0.26), rgba(61,107,255,0.08))'
                    : 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                  border: configVisible
                    ? '1px solid rgba(61, 107, 255, 0.4)'
                    : '1px solid var(--panel-border)',
                  boxShadow: configVisible
                    ? '0 0 14px rgba(61,107,255,0.3), inset 0 1px 0 rgba(255,255,255,0.12)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <HugeiconsIcon
                  icon={configVisible ? ViewIcon : ViewOffSlashIcon}
                  size={20}
                  strokeWidth={1.9}
                  style={{
                    color: configVisible
                      ? 'var(--accent-primary)'
                      : 'var(--text-secondary)',
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold gl-metal-text truncate">
                  {t('showConfig')}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('showConfigDesc')}
                </div>
              </div>
            </div>

            {/* Toggle with status */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                className="text-[10px] font-mono font-bold tracking-wider tabular-nums"
                style={{
                  color: configVisible
                    ? 'var(--accent-primary)'
                    : 'var(--text-secondary)',
                }}
              >
                {configVisible ? t('visible') : t('hidden')}
              </span>
              <button
                type="button"
                className="gl-switch"
                data-on={configVisible ? 'true' : 'false'}
                disabled={disabled}
                aria-pressed={configVisible}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!disabled) onConfigVisibleChange(!configVisible)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublishSettingsEditor
