'use client'

import { useTideCloak } from '@tidecloak/nextjs'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const C = {
  bg: '#0f172a', surface: '#1e293b', border: '#334155',
  brand: '#10b981', brandDim: 'rgba(16, 185, 129, 0.12)',
  text: '#f8fafc', muted: '#94a3b8', dim: '#64748b',
  error: '#fca5a5', errorBg: 'rgba(239, 68, 68, 0.1)',
  warn: '#fbbf24', warnBg: 'rgba(251, 191, 36, 0.12)',
}

interface Closing {
  id: string
  property: string
  buyer: string
  seller: string
  amount: string
  status: 'pending' | 'active' | 'completed'
  createdAt: string
  confirmedBuyer?: boolean
  confirmedSeller?: boolean
}

export default function ClosingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getValueFromIdToken, token, doDecrypt } = useTideCloak()
  const [closing, setClosing] = useState<Closing | null>(null)
  const [username, setUsername] = useState('')
  const [decrypted, setDecrypted] = useState('')
  const [decrypting, setDecrypting] = useState(false)
  const [decryptError, setDecryptError] = useState('')
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (token) setUsername(getValueFromIdToken('preferred_username') || 'User')
    const closings = JSON.parse(localStorage.getItem('clozr-closings') || '[]')
    const found = closings.find((c: Closing) => c.id === id)
    if (found) {
      setClosing(found)
      setConfirmed({ buyer: !!found.confirmedBuyer, seller: !!found.confirmedSeller })
    }
  }, [id, token])

  const onDecrypt = useCallback(async () => {
    setDecrypting(true); setDecryptError(''); setDecrypted('')
    try {
      const TAG = 'closing'
      const ciphertext = localStorage.getItem(`clozr-sealed:${id}`)
      if (!ciphertext) throw new Error('No encrypted data found for this closing')
      const [pt] = await doDecrypt([{ encrypted: ciphertext, tags: [TAG] }])
      const data = JSON.parse(String(pt))
      setDecrypted(JSON.stringify(data, null, 2))
    } catch (err: any) {
      setDecryptError(err.message || 'Decryption failed')
    } finally {
      setDecrypting(false)
    }
  }, [id, doDecrypt])

  const onConfirm = useCallback((role: 'buyer' | 'seller') => {
    const key = role === 'buyer' ? 'confirmedBuyer' : 'confirmedSeller'
    const updated = { ...confirmed, [role]: true }
    setConfirmed(updated)

    const closings = JSON.parse(localStorage.getItem('clozr-closings') || '[]')
    const idx = closings.findIndex((c: Closing) => c.id === id)
    if (idx >= 0) {
      closings[idx][key] = true
      if (updated.buyer && updated.seller) {
        closings[idx].status = 'completed'
      }
      localStorage.setItem('clozr-closings', JSON.stringify(closings))
      setClosing(closings[idx])
    }
  }, [id, confirmed])

  if (!closing) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 32px', borderBottom: `1px solid ${C.border}`, background: C.surface,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: `linear-gradient(135deg, ${C.brand} 0%, #059669 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '16px', fontWeight: 700,
              }}>◈</div>
              <span style={{ color: C.text, fontWeight: 700, fontSize: '18px' }}>Clozr</span>
            </Link>
            <span style={{ color: C.dim, fontSize: '13px' }}>/</span>
            <Link href="/closings" style={{ color: C.muted, fontSize: '14px', textDecoration: 'none' }}>Closings</Link>
            <span style={{ color: C.dim, fontSize: '13px' }}>/</span>
            <span style={{ color: C.text, fontSize: '14px' }}>{id}</span>
          </div>
          <span style={{ color: C.muted, fontSize: '13px' }}>{username}</span>
        </nav>

        <div style={{ padding: '40px 32px', maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', padding: '60px 24px', borderRadius: '12px',
            border: `2px dashed ${C.border}`, background: C.surface,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
              Closing Not Found
            </h2>
            <p style={{ fontSize: '14px', color: C.muted, margin: '0 0 24px', lineHeight: 1.55, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              This closing doesn't exist or may have been removed. Create a new closing to start an atomic swap.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link
                href="/closings/new"
                style={{
                  display: 'inline-block', padding: '12px 24px', borderRadius: '10px',
                  background: C.brand, color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                }}
              >Create New Closing</Link>
              <Link
                href="/closings"
                style={{
                  display: 'inline-block', padding: '12px 24px', borderRadius: '10px',
                  border: `1px solid ${C.border}`, color: C.muted, fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                }}
              >View All Closings</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const bothConfirmed = confirmed.buyer && confirmed.seller
  const statusLabel = bothConfirmed ? 'completed' : closing.status

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: `1px solid ${C.border}`, background: C.surface,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${C.brand} 0%, #059669 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '16px', fontWeight: 700,
            }}>◈</div>
            <span style={{ color: C.text, fontWeight: 700, fontSize: '18px' }}>Clozr</span>
          </Link>
          <span style={{ color: C.dim, fontSize: '13px' }}>/</span>
          <Link href="/closings" style={{ color: C.muted, fontSize: '14px', textDecoration: 'none' }}>Closings</Link>
          <span style={{ color: C.dim, fontSize: '13px' }}>/</span>
          <span style={{ color: C.text, fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{closing.property}</span>
        </div>
        <span style={{ color: C.muted, fontSize: '13px' }}>{username}</span>
      </nav>

      <div style={{ padding: '40px 32px', maxWidth: '720px', margin: '0 auto' }}>
        {/* Status banner */}
        <div style={{
          padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
          background: bothConfirmed ? C.brandDim : C.warnBg,
          border: `1px solid ${bothConfirmed ? C.brand : C.warn}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{bothConfirmed ? '✅' : '⏳'}</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: bothConfirmed ? C.brand : C.warn }}>
                {bothConfirmed ? 'Atomic Swap Complete!' : 'Awaiting Confirmations'}
              </div>
              <div style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>
                {bothConfirmed
                  ? 'Both parties confirmed. Funds and deed would unlock simultaneously on the Tide network.'
                  : `${confirmed.buyer ? '✓' : '○'} Buyer · ${confirmed.seller ? '✓' : '○'} Seller — both must confirm for the swap to execute.`
                }
              </div>
            </div>
          </div>
        </div>

        {/* Closing details card */}
        <div style={{ padding: '24px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.surface, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: C.text, margin: '0 0 16px' }}>Closing Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              ['Property', closing.property],
              ['Buyer', closing.buyer],
              ['Seller', closing.seller],
              ['Amount', closing.amount],
              ['Status', statusLabel],
              ['Created', new Date(closing.createdAt).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '12px', color: C.dim, marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '14px', color: C.text, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm buttons */}
        {!bothConfirmed && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => onConfirm('buyer')}
              disabled={confirmed.buyer}
              style={{
                flex: 1, padding: '14px 24px', borderRadius: '12px', border: 'none',
                background: confirmed.buyer ? C.brandDim : C.brand,
                color: confirmed.buyer ? C.brand : '#fff',
                fontSize: '14px', fontWeight: 600, cursor: confirmed.buyer ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {confirmed.buyer ? '✓ Buyer Confirmed' : 'Confirm as Buyer'}
            </button>
            <button
              onClick={() => onConfirm('seller')}
              disabled={confirmed.seller}
              style={{
                flex: 1, padding: '14px 24px', borderRadius: '12px', border: 'none',
                background: confirmed.seller ? C.brandDim : C.brand,
                color: confirmed.seller ? C.brand : '#fff',
                fontSize: '14px', fontWeight: 600, cursor: confirmed.seller ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {confirmed.seller ? '✓ Seller Confirmed' : 'Confirm as Seller'}
            </button>
          </div>
        )}

        {/* Decrypt sealed data */}
        <div style={{ padding: '24px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.surface }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
            🔐 Tide-Sealed Closing Data
          </h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 16px' }}>
            This closing was sealed with Tide self-encryption. Only you can decrypt it — the server cannot read it.
          </p>

          <button
            onClick={onDecrypt}
            disabled={decrypting}
            style={{
              padding: '12px 20px', borderRadius: '10px', border: `1px solid ${C.brand}`,
              background: 'transparent', color: C.brand, fontSize: '14px', fontWeight: 600,
              cursor: decrypting ? 'not-allowed' : 'pointer', opacity: decrypting ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            {decrypting ? 'Decrypting…' : 'Decrypt Sealed Data'}
          </button>

          {decryptError && (
            <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: C.errorBg, color: C.error, fontSize: '13px' }}>
              {decryptError}
            </div>
          )}

          {decrypted && (
            <pre style={{
              marginTop: '12px', padding: '16px', borderRadius: '10px',
              background: '#0f172a', border: `1px solid ${C.border}`,
              color: C.brand, fontSize: '13px', overflow: 'auto', maxHeight: '240px',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}>
              {decrypted}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}