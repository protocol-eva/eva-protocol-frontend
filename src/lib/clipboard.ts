import { notify } from './notify'

/** Copy text to the clipboard and show a toast. */
export async function copyWithToast(
  text: string,
  successMsg = 'Copied to clipboard',
  errorMsg = 'Copy failed'
) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    notify.success(successMsg)
    return true
  } catch (err) {
    console.error('Clipboard copy failed:', err)
    notify.error(errorMsg)
    return false
  }
}

export default { copyWithToast }
