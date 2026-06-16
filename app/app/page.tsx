'use client'

import { useCallback } from 'react'
import { useTideCloak } from '@tidecloak/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: '480px',
    width: '100%',
    padding: '40px',
    textAlign: 'center' as const,
  },
  brandmark: {
    display: 'inline-block',
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    marginBottom: '24px',
    boxShadow: '0 0 40px rgba(16, 185, 129, 0.25)',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '28px',
    color: '#fff',
  },
  headline: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#f8fafc',
    margin: '0 0 8px',
    lineHeight: 1.2,
  },
  subhead: {
    fontSize: '15px',
    color: '#94a3b8',
    margin: '0 0 32px',
    lineHeight: 1.55,
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '32px',
    textAlign: 'left' as const,
    padding: '0 16px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#cbd5e1',
  },
  featureIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '15px',
  },
  cta: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
    letterSpacing: '-0.01em',
  },
  footer: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#64748b',
  },
}

export default function LoginPage() {
  const { login, authenticated } = useTideCloak()
  const router = useRouter()

  const onLogin = useCallback(() => {
    login()
  }, [login])

  useEffect(() => {
    if (authenticated) {
      router.push('/home')
    }
  }, [authenticated, router])

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandmark}>
          <div style={styles.logoIcon}>◈</div>
        </div>

        <h1 style={styles.headline}>Close without the closer</h1>
        <p style={styles.subhead}>
          Atomic swap closings powered by Tide split-key cryptography.
          No escrow officer. No lockbox. No single point of failure.
        </p>

        <div style={styles.featureList}>
          {[
            ['🔐', 'Every document sealed to your identity — we literally cannot read it'],
            ['⚡', 'Funds and deed unlock simultaneously — or not at all'],
            ['🛡️', 'No custodian, no wire fraud, no insider threat'],
          ].map(([icon, text]) => (
            <div key={text} style={styles.featureItem}>
              <div style={styles.featureIcon}>{icon}</div>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onLogin}
          style={styles.cta}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}
        >
          Continue with Tide
        </button>

        <p style={styles.footer}>
          $4B escrow industry &middot; replaced by math
        </p>
      </div>
    </div>
  )
}
