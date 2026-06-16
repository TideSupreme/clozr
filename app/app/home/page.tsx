'use client'

import { useTideCloak } from '@tidecloak/nextjs'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

const C = {
  bg: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  brand: '#10b981',
  brandDim: 'rgba(16, 185, 129, 0.12)',
  text: '#f8fafc',
  muted: '#94a3b8',
  dim: '#64748b',
}

const navLinkStyle = {
  color: C.muted,
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '8px 16px',
  borderRadius: '8px',
  transition: 'all 0.15s',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
}

export default function HomePage() {
  const { logout, getValueFromIdToken, token } = useTideCloak()
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (token) {
      setUsername(getValueFromIdToken('preferred_username') || 'User')
    }
  }, [token])

  const onLogout = useCallback(() => logout(), [logout])

  const features = [
    {
      href: '/closings/new',
      icon: '🏠',
      title: 'New Closing',
      desc: 'Create an atomic swap closing. Set buyer, seller, property, and amount.',
      accent: C.brand,
    },
    {
      href: '/closings',
      icon: '📋',
      title: 'All Closings',
      desc: 'View your active, pending, and completed closings in one dashboard.',
    },
    {
      href: '/documents',
      icon: '🔒',
      title: 'Document Vault',
      desc: 'Encrypted documents sealed to your identity. Only you hold the key.',
    },
    {
      href: '/verify',
      icon: '✅',
      title: 'Verify',
      desc: 'Server-side Tide JWT verification — prove your closing authority.',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: `linear-gradient(135deg, ${C.brand} 0%, #059669 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '16px', fontWeight: 700,
          }}>◈</div>
          <span style={{ color: C.text, fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>Clozr</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: C.muted, fontSize: '13px' }}>{username}</span>
          <button
            onClick={onLogout}
            style={{ ...navLinkStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '48px 32px 40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '20px',
            background: C.brandDim,
            color: C.brand,
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '16px',
          }}>
            Tide-Powered Atomic Swap
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: C.text, margin: '0 0 8px', lineHeight: 1.2 }}>
            Welcome, {username}
          </h1>
          <p style={{ fontSize: '15px', color: C.muted, margin: 0, lineHeight: 1.55, maxWidth: '560px' }}>
            Your closing dashboard is ready. Every transaction is secured by Tide split-key cryptography — no escrow officer, no lockbox, no single point of failure.
          </p>
        </div>

        {/* Feature grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              style={{
                display: 'block',
                padding: '24px',
                borderRadius: '12px',
                border: `1px solid ${C.border}`,
                background: C.surface,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.brand
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: C.text, margin: '0 0 4px' }}>{f.title}</h2>
              <p style={{ fontSize: '13px', color: C.muted, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

