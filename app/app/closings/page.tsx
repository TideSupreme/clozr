'use client'

import { useTideCloak } from '@tidecloak/nextjs'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

const C = {
  bg: '#0f172a', surface: '#1e293b', border: '#334155',
  brand: '#10b981', brandDim: 'rgba(16, 185, 129, 0.12)',
  text: '#f8fafc', muted: '#94a3b8', dim: '#64748b',
}

interface Closing {
  id: string
  property: string
  buyer: string
  seller: string
  amount: string
  status: 'pending' | 'active' | 'completed'
  createdAt: string
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24', label: 'Pending' },
  active: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', label: 'Active' },
  completed: { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', label: 'Completed' },
}

function loadClosings(): Closing[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('clozr-closings') || '[]')
  } catch { return [] }
}

export default function ClosingsPage() {
  const { getValueFromIdToken, token } = useTideCloak()
  const [closings, setClosings] = useState<Closing[]>([])
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (token) setUsername(getValueFromIdToken('preferred_username') || 'User')
    setClosings(loadClosings())
  }, [token])

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
          <span style={{ color: C.muted, fontSize: '14px' }}>Closings</span>
        </div>
        <span style={{ color: C.muted, fontSize: '13px' }}>{username}</span>
      </nav>

      <div style={{ padding: '40px 32px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>All Closings</h1>
            <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>Your atomic swap transactions</p>
          </div>
          <Link
            href="/closings/new"
            style={{
              padding: '10px 20px', borderRadius: '10px', background: C.brand, color: '#fff',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >+ New Closing</Link>
        </div>

        {closings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 24px', borderRadius: '12px',
            border: `2px dashed ${C.border}`, background: C.surface,
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <p style={{ color: C.muted, fontSize: '15px', margin: '0 0 16px' }}>
              No closings yet. Create your first atomic swap.
            </p>
            <Link
              href="/closings/new"
              style={{
                display: 'inline-block', padding: '10px 20px', borderRadius: '10px',
                background: C.brand, color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
              }}
            >Create Closing</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {closings.map((c) => {
              const st = statusColors[c.status]
              return (
                <Link
                  key={c.id}
                  href={`/closings/${c.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px', borderRadius: '12px', border: `1px solid ${C.border}`,
                    background: C.surface, textDecoration: 'none', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.brand }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>
                      {c.property}
                    </div>
                    <div style={{ fontSize: '13px', color: C.muted }}>
                      {c.buyer} → {c.seller} &middot; {c.amount}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: st.bg, color: st.color,
                  }}>{st.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}