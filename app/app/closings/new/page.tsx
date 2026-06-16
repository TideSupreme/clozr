'use client'

import { useTideCloak } from '@tidecloak/nextjs'
import { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const C = {
  bg: '#0f172a', surface: '#1e293b', border: '#334155',
  brand: '#10b981', brandDim: 'rgba(16, 185, 129, 0.12)',
  text: '#f8fafc', muted: '#94a3b8', dim: '#64748b',
  error: '#fca5a5', errorBg: 'rgba(239, 68, 68, 0.1)',
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  border: `1px solid ${C.border}`,
  background: C.surface,
  color: C.text,
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: 'inherit',
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: C.muted,
  marginBottom: '6px',
}

export default function NewClosingPage() {
  const { getValueFromIdToken, token, doEncrypt } = useTideCloak()
  const router = useRouter()
  const [username, setUsername] = useState('')

  const [property, setProperty] = useState('')
  const [buyer, setBuyer] = useState('')
  const [seller, setSeller] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (token) setUsername(getValueFromIdToken('preferred_username') || 'User')
  }, [token])

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setSuccess('')

    try {
      if (!property || !buyer || !seller || !amount) {
        throw new Error('All fields are required')
      }

      const id = 'clz-' + Date.now().toString(36)
      const closing = {
        id,
        property,
        buyer,
        seller,
        amount,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      }

      // Encrypt the closing data with self-encryption — only this user can decrypt
      const TAG = 'closing'
      const [ciphertext] = await doEncrypt([{ data: JSON.stringify(closing), tags: [TAG] }])

      // Store both the plaintext (for listing) and ciphertext (for secure detail view)
      const stored = JSON.parse(localStorage.getItem('clozr-closings') || '[]')
      stored.unshift(closing)
      localStorage.setItem('clozr-closings', JSON.stringify(stored))
      localStorage.setItem(`clozr-sealed:${id}`, ciphertext)

      setSuccess(`Closing created! Atomic swap is active for ${property}`)
      setTimeout(() => router.push(`/closings/${id}`), 800)
    } catch (err: any) {
      setError(err.message || 'Failed to create closing')
    } finally {
      setBusy(false)
    }
  }, [property, buyer, seller, amount, doEncrypt, router])

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
          <span style={{ color: C.text, fontSize: '14px' }}>New</span>
        </div>
        <span style={{ color: C.muted, fontSize: '13px' }}>{username}</span>
      </nav>

      <div style={{ padding: '40px 32px', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
            background: C.brandDim, color: C.brand, fontSize: '12px', fontWeight: 600, marginBottom: '12px',
          }}>
            Atomic Swap Closing
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>New Closing</h1>
          <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>
            Create an atomic swap. Both parties confirm, or nothing moves.
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Property Address</label>
            <input
              name="property"
              value={property}
              onChange={(e) => setProperty(e.target.value)}
              placeholder="123 Main Street, Springfield, IL"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Buyer</label>
              <input
                name="buyer"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder="James Wilson"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Seller</label>
              <input
                name="seller"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="Maria Garcia"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Closing Amount</label>
            <input
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="$425,000"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: C.errorBg, color: C.error, fontSize: '14px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: C.brandDim, color: C.brand, fontSize: '14px' }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              padding: '14px 24px', borderRadius: '12px', border: 'none',
              background: C.brand, color: '#fff', fontSize: '15px', fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            {busy ? 'Creating…' : 'Create Closing'}
          </button>
        </form>
      </div>
    </div>
  )
}