import type { Language } from '../i18n/translations'

interface LanguageToggleProps {
  language: Language
  onLanguageChange: (lang: Language) => void
  className?: string
  size?: 'sm' | 'md'
}

export function LanguageToggle({
  language,
  onLanguageChange,
  className = '',
  size = 'md',
}: LanguageToggleProps) {
  const sizeClass = size === 'sm' ? 'gl-lang-toggle--sm' : 'gl-lang-toggle--md'

  return (
    <div
      className={`gl-lang-toggle ${sizeClass} shrink-0 ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => onLanguageChange('en')}
        className="gl-lang-toggle__btn"
        aria-pressed={language === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onLanguageChange('zh')}
        className="gl-lang-toggle__btn"
        aria-pressed={language === 'zh'}
      >
        中文
      </button>
    </div>
  )
}
