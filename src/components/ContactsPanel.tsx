import { useState, useEffect, useRef } from 'react'
import { X, UserPlus, Trash2, BookUser, Check, AlertCircle } from 'lucide-react'
import {
  type Contact,
  getContacts,
  saveContact,
  deleteContact,
  isValidAddress,
} from '../lib/contacts'
import { t as translate, type Language } from '../i18n/translations'

interface ContactsPanelProps {
  open: boolean
  language?: Language
  onClose: () => void
  onContactsChange: (contacts: Contact[]) => void
}

type ContactValidationError = 'nameRequired' | 'addressRequired' | 'invalidAddress'

export default function ContactsPanel({
  open,
  language = 'en',
  onClose,
  onContactsChange,
}: ContactsPanelProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const tr = (key: string) => translate(`landingPage.contactsPanel.${key}`, language)

  useEffect(() => {
    if (open) {
      getContacts().then((c) => setContacts(c))
      setTimeout(() => nameRef.current?.focus(), 80)
    }
  }, [open])

  const refresh = async () => {
    const c = await getContacts()
    setContacts(c)
    onContactsChange(c)
  }

  const validateContact = (
    contactName: string,
    contactAddress: string
  ): ContactValidationError | null => {
    if (!contactName.trim()) return 'nameRequired'
    if (!contactAddress.trim()) return 'addressRequired'
    if (!isValidAddress(contactAddress.trim())) return 'invalidAddress'
    return null
  }

  const handleAdd = async () => {
    setError('')
    const trimName = name.trim().toLowerCase()
    const trimAddr = address.trim()
    const validation = validateContact(trimName, trimAddr)
    if (validation) {
      setError(tr(`errors.${validation}`))
      return
    }
    await saveContact({ name: trimName, address: trimAddr })
    setName('')
    setAddress('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
    await refresh()
    nameRef.current?.focus()
  }

  const handleDelete = async (contactName: string) => {
    await deleteContact(contactName)
    await refresh()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      />

      <div
        className="relative w-full max-w-md mx-auto rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--panel-border)',
          maxHeight: '85vh',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--panel-border)' }}
        >
          <div className="flex items-center gap-2">
            <BookUser
              className="w-4 h-4"
              style={{ color: 'var(--accent-primary)' }}
            />
            <span
              className="font-semibold text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              {tr('title')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--panel-border)' }}
        >
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            {tr('description')}{' '}
            <span
              className="font-mono px-1 rounded"
              style={{
                background: 'var(--surface-tertiary)',
                color: 'var(--accent-primary)',
              }}
            >
              {tr('example')}
            </span>{' '}
            {tr('inChat')}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={tr('namePlaceholder')}
                className="flex-1 text-sm px-3 py-2 rounded-lg outline-none min-w-0"
                style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div className="flex gap-2">
              <input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={tr('addressPlaceholder')}
                className="flex-1 text-sm px-3 py-2 rounded-lg outline-none font-mono min-w-0"
                style={{
                  background: 'var(--surface-secondary)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'var(--panel-border)'}`,
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold shrink-0 transition-all"
                style={{ background: 'var(--accent-primary)', color: '#fff' }}
              >
                {saved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {saved ? tr('saved') : tr('add')}
              </button>
            </div>
          </div>
          {error && (
            <div
              className="flex items-center gap-1.5 mt-2 text-xs"
              style={{ color: 'rgba(239,68,68,0.9)' }}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {contacts.length === 0 ? (
            <div
              className="px-5 py-8 text-center text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {tr('empty')}
            </div>
          ) : (
            <ul>
              {contacts.map((c, i) => (
                <li
                  key={c.name}
                  className="flex items-center gap-3 px-5 py-3 transition-colors"
                  style={{
                    borderBottom:
                      i < contacts.length - 1
                        ? '1px solid var(--panel-border)'
                        : 'none',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: 'var(--accent-primary-bg)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {c.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {c.name}
                      </span>
                    </div>
                    <div
                      className="text-[11px] font-mono truncate mt-0.5"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {c.address}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(c.name)}
                    className="p-1.5 rounded-lg transition-colors shrink-0"
                    style={{ color: 'var(--text-tertiary)' }}
                    title={tr('deleteTitle')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {contacts.length > 0 && (
          <div
            className="px-5 py-3 text-xs shrink-0"
            style={{
              borderTop: '1px solid var(--panel-border)',
              color: 'var(--text-tertiary)',
            }}
          >
            {tr('footer')}
          </div>
        )}
      </div>
    </div>
  )
}
