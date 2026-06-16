'use client'

import { useTideCloak } from '@tidecloak/nextjs'
import { useCallback, useState, useEffect } from 'react'
import Link from 'next/link'

const C = {
  bg: '#0f172a', surface: '#1e293b', border: '#334155',
  brand: '#10b981', brandDim: 'rgba(16, 185, 129, 0.12)',
  text: '#f8fafc', muted: '#94a3b8', dim: '#64748b',
  error: '#fca5a5', errorBg: 'rgba(239, 68, 68, 0.1)',
}

export default function VerifyPage() {
  const { token, getValueFromIdToken } = useTideCloak()
  const [username, setUsername] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; data: any } | null>(null)

  useEffect(() => {
    if (token) setUsername(getValueFromIdToken('preferred_username') || 'User')
  }, [token])

  const onVerify = useCallback(async () => {
    setVerifying(true); setResult(null)
    try {
      const res = await fetch('/api/protected', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setResult({ ok: res.ok, data })
    } catch (err: any) {
      setResult({ ok: false, data: { error: err.message } })
    } finally {
      setVerifying(false)
    }
  }, [token])

  const vuid = getValueFromIdToken('vuid')
  const tideUserKey = getValueFromIdToken('tideuserkey')

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
          <span style={{ color: C.muted, fontSize: '14px' }}>Verify</span>
        </div>
        <span style={{ color: C.muted, fontSize: '13px' }}>{username}</span>
      </nav>

      <div style={{ padding: '40px 32px', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
            background: C.brandDim, color: C.brand, fontSize: '12px', fontWeight: 600, marginBottom: '12px',
          }}>
            Server-Side JWT Verification
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Verify Authority</h1>
          <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>
            Prove your Tide-authenticated identity to the server. The API verifies your JWT signature using the embedded JWKS — no remote key fetch, no trust-on-first-use.
          </p>
        </div>

        {/* Identity card */}
        <div style={{
          padding: '24px', borderRadius: '12px', border: `1px solid ${C.border}`,
          background: C.surface, marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: C.text, margin: '0 0 16px' }}>
            Your Tide Identity
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              ['Username', username],
              ['VUID', vuid || '(not loaded)'],
              ['Tide User Key', tideUserKey ? `${tideUserKey.slice(0, 12)}…` : '(not loaded)'],
              ['Session Bound', token ? 'DPoP-bound JWT' : '(not authenticated)'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '12px', color: C.dim, marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '14px', color: C.text, fontWeight: 500, wordBreak: 'break-all' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Verify button */}
        <div style={{
          padding: '24px', borderRadius: '12px', border: `1px solid ${C.border}`,
          background: C.surface, marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
            Server-Side Verification
          </h2>
          <p style={{ fontSize: '13px', color: C.muted, margin: '0 0 16px' }}>
            This calls <code style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>/api/protected</code> which verifies your Tide JWT signature server-side using the embedded JWKS. Client-side role checks don't secure anything — this is real authorization.
          </p>

          <button
            onClick={onVerify}
            disabled={verifying}
            style={{
              padding: '12px 24px', borderRadius: '10px', border: 'none',
              background: C.brand, color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: verifying ? 'not-allowed' : 'pointer', opacity: verifying ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            {verifying ? 'Verifying…' : 'Verify JWT Server-Side'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            padding: '20px', borderRadius: '12px', border: `1px solid ${result.ok ? C.brand : '#ef4444'}`,
            background: result.ok ? C.brandDim : C.errorBg,
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: result.ok ? C.brand : C.error, marginBottom: '12px' }}>
              {result.ok ? '✅ JWT Verified' : '❌ Verification Failed'}
            </div>
            <pre style={{
              margin: 0, padding: '12px', borderRadius: '8px',
              background: '#0f172a', color: result.ok ? C.brand : C.error,
              fontSize: '13px', overflow: 'auto', maxHeight: '200px',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}