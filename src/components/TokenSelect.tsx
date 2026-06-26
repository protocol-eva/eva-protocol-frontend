import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

/* ============================================================================
   TokenSelect — a polished accessible token dropdown (Radix UI Select, the
   primitive shadcn wraps), styled with our blue-black .gl-select-* theme and
   showing each token's logo. Used by the Data-page converter.
   ========================================================================== */

export type TokenOption = {
  value: string
  /** display ticker, e.g. "BTC", "USD" */
  label: string
  /** logo URL (CoinGecko image); omit for fiat → renders a glyph chip */
  image?: string
}

function TokenLogo({ image, label }: { image?: string; label: string }) {
  if (image) {
    return <img src={image} alt="" className="gl-select-logo" loading="lazy" />
  }
  return (
    <span className="gl-select-logo gl-select-logo-fiat" aria-hidden="true">
      {label === 'USD' ? '$' : label.charAt(0)}
    </span>
  )
}

export default function TokenSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: TokenOption[]
  ariaLabel?: string
}) {
  const selected = options.find((o) => o.value === value)

  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="gl-select-trigger" aria-label={ariaLabel}>
        <span className="gl-select-trigger-inner">
          {selected && (
            <TokenLogo image={selected.image} label={selected.label} />
          )}
          <span className="gl-select-trigger-label">
            {selected?.label ?? ''}
          </span>
        </span>
        <Select.Icon asChild>
          <ChevronDown className="gl-select-chev" size={14} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="gl-select-content"
          position="popper"
          sideOffset={6}
        >
          <Select.Viewport className="gl-select-viewport">
            {options.map((o) => (
              <Select.Item
                key={o.value}
                value={o.value}
                className="gl-select-item"
              >
                <TokenLogo image={o.image} label={o.label} />
                <Select.ItemText>{o.label}</Select.ItemText>
                <Select.ItemIndicator className="gl-select-check">
                  <Check size={14} strokeWidth={3} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
