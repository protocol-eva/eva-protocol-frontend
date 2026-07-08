export function buildOtpAuthUrl(
  email: string,
  secret: string,
  issuer = 'EVA'
): string {
  return `otpauth://totp/${encodeURIComponent(email)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}`
}
