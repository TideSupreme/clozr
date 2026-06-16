'use client'

import { useTideCloak } from '@tidecloak/nextjs'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

const C = {
  bg: '#0f172a', surface: '#1e293b', border: '#334155',
  brand: '#10b981', brandDim: 'rgba(16, 185, 129, 0.12)',
  text: '#f8fafc', muted: '#94a3b8', dim: '#64748b',
  error: '#fca5a5', errorBg: 'rgba(239, 68, 68, 0.1)',
}

const TAG = 'clozr-doc'
const STORAGE_KEY = 'clozr-documents'

interface DocEntry {
  id: string
  name: string
  sealed: string
  createdAt: string
}

function loadDocs(): DocEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
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

export default function DocumentsPage() {
  const { getValueFromIdToken, token, doEncrypt, doDecrypt } = useTideCloak()
  const [username, setUsername] = useState('')
  const [docs, setDocs] = useState<DocEntry[]>([])
  const [docName, setDocName] = useState('')
  const [docContent, setDocContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [decrypting, setDecrypting] = useState<Record<string, boolean>>({})
  const [decrypted, setDecrypted] = useState<Record<string, string>>({})
  const [decryptErr, setDecryptErr] = useState<Record<string, string>>({})

  useEffect(() => {
    if (token) setUsername(getValueFromIdToken('preferred_username') || 'User')
    setDocs(loadDocs())
  }, [token])

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setSuccess('')
    try {
      if (!docName.trim() || !docContent.trim()) throw new Error('Document name and content are required')

      const [ciphertext] = await doEncrypt([{ data: docContent, tags: [TAG] }])
      const entry: DocEntry = {
        id: 'doc-' + Date.now().toString(36),
        name: docName.trim(),
        sealed: ciphertext,
        createdAt: new Date().toISOString(),
      }

      const updated = [entry, ...loadDocs()]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setDocs(updated)
      setDocName('')
      setDocContent('')
      setSuccess(`"${entry.name}" sealed with Tide encryption. Only you will ever see this.`)
    } catch (err: any) {
      setError(err.message || 'Failed to seal document')
    } finally {
      setBusy(false)
    }
  }, [docName, docContent, doEncrypt])

  const onDecrypt = useCallback(async (doc: DocEntry) => {
    setDecrypting(prev => ({ ...prev, [doc.id]: true }))
    setDecryptErr(prev => { const n = { ...prev }; delete n[doc.id]; return n })
    try {
      const [pt] = await doDecrypt([{ encrypted: doc.sealed, tags: [TAG] }])
      setDecrypted(prev => ({ ...prev, [doc.id]: String(pt) }))
    } catch (err: any) {
      setDecryptErr(prev => ({ ...prev, [doc.id]: err.message || 'Decryption failed' }))
    } finally {
      setDecrypting(prev => ({ ...prev, [doc.id]: false }))
    }
  }, [doDecrypt])

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
          <span style={{ color: C.muted, fontSize: '14px' }}>Document Vault</span>
        </div>
        <span style={{ color: C.muted, fontSize: '13px' }}>{username}</span>
      </nav>

      <div style={{ padding: '40px 32px', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
            background: C.brandDim, color: C.brand, fontSize: '12px', fontWeight: 600, marginBottom: '12px',
          }}>
            Tide Self-Encrypted
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Document Vault</h1>
          <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>
            Every document is sealed to your identity. We literally cannot read your data — only you hold the key.
          </p>
        </div>

        {/* Create form */}
        <form onSubmit={onSubmit} style={{
          padding: '24px', borderRadius: '12px', border: `1px solid ${C.border}`,
          background: C.surface, marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          <div>
            <label style={labelStyle}>Document Name</label>
            <input
              name="docName"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Title Commitment — 123 Main St"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Content</label>
            <textarea
              name="docContent"
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Enter the document contents to seal with Tide encryption…"
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: '8px', background: C.errorBg, color: C.error, fontSize: '13px' }}>{error}</div>}
          {success && <div style={{ padding: '10px 14px', borderRadius: '8px', background: C.brandDim, color: C.brand, fontSize: '13px' }}>{success}</div>}

          <button
            type="submit"
            disabled={busy}
            style={{
              padding: '12px 24px', borderRadius: '10px', border: 'none',
              background: C.brand, color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? 'Sealing…' : 'Seal Document'}
          </button>
        </form>

        {/* Document list */}
        {docs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px', borderRadius: '12px',
            border: `2px dashed ${C.border}`, background: C.surface,
          }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
            <p style={{ color: C.muted, fontSize: '14px', margin: 0 }}>
              Your vault is empty. Seal a document above to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {docs.map((doc) => (
              <div key={doc.id} style={{
                padding: '20px', borderRadius: '12px', border: `1px solid ${C.border}`,
                background: C.surface,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{doc.name}</div>
                    <div style={{ fontSize: '12px', color: C.dim, marginTop: '2px' }}>
                      Sealed {new Date(doc.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => onDecrypt(doc)}
                    disabled={decrypting[doc.id]}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.brand}`,
                      background: 'transparent', color: C.brand, fontSize: '13px', fontWeight: 600,
                      cursor: decrypting[doc.id] ? 'not-allowed' : 'pointer',
                      opacity: decrypting[doc.id] ? 0.5 : 1,
                    }}
                  >
                    {decrypting[doc.id] ? 'Decrypting…' : 'Decrypt'}
                  </button>
                </div>

                {decryptErr[doc.id] && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: C.errorBg, color: C.error, fontSize: '13px', marginTop: '8px' }}>
                    {decryptErr[doc.id]}
                  </div>
                )}

                {decrypted[doc.id] && (
                  <div style={{
                    marginTop: '8px', padding: '12px', borderRadius: '8px',
                    background: '#0f172a', border: `1px solid ${C.border}`,
                    color: C.brand, fontSize: '13px', whiteSpace: 'pre-wrap',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  }}>
                    {decrypted[doc.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}