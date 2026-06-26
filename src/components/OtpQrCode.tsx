import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { buildOtpAuthUrl } from '../lib/otpAuth'

interface OtpQrCodeProps {
  email: string
  secret: string
  issuer?: string
  size?: number
  className?: string
}

export function OtpQrCode({
  email,
  secret,
  issuer = 'EVA',
  size = 144,
  className = 'w-36 h-36',
}: OtpQrCodeProps) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    const trimmedSecret = secret.trim()
    if (!trimmedSecret) {
      setSrc('')
      return
    }

    let cancelled = false
    const otpUrl = buildOtpAuthUrl(email, trimmedSecret, issuer)

    QRCode.toDataURL(otpUrl, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl)
      })
      .catch(() => {
        if (!cancelled) setSrc('')
      })

    return () => {
      cancelled = true
    }
  }, [email, secret, issuer, size])

  if (!secret.trim()) {
    return (
      <div
        className={`${className} mx-auto rounded-xl animate-pulse mb-4`}
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
    )
  }

  if (!src) {
    return (
      <div
        className={`${className} mx-auto rounded-xl animate-pulse mb-4`}
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
    )
  }

  return (
    <div className="inline-block p-3 rounded-xl bg-white mx-auto mb-4">
      <img src={src} alt="QR Code" className={className} />
    </div>
  )
}
