import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Logo from './Logo.jsx'

export default function Auth() {
  const [mode, setMode] = useState('password') // 'password' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function send(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    setBusy(false)
    if (error) setErr(error.message)
    else setSent(true)
  }

  async function signInPassword(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setErr(error.message)
    // on success, App's onAuthStateChange takes over — session persists locally
  }

  return (
    <div className="wrap">
      <div className="authbox">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div className="logo" style={{ width: 56, height: 56, borderRadius: 16 }}>
            <Logo size={56} />
          </div>
        </div>
        <h1>Sean's Cut</h1>
        <p className="sub" style={{ marginBottom: 18 }}>
          Sign in to sync across your phone &amp; desktop
        </p>
        <div className="card">
          {sent ? (
            <>
              <h2>Check your email</h2>
              <p className="note">
                We sent a magic link to <b>{email}</b>. Tap it on this device to
                log in — no password needed.
              </p>
              <button
                className="ghost"
                style={{ width: '100%', marginTop: 12 }}
                onClick={() => setSent(false)}
              >
                ← Back
              </button>
            </>
          ) : mode === 'password' ? (
            <form onSubmit={signInPassword}>
              <h2>Sign in</h2>
              <label className="f">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seanculleton02@gmail.com"
                />
              </label>
              <label className="f">
                Password
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <button className="primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
              {err && (
                <p className="note" style={{ color: 'var(--bad)', marginTop: 10 }}>
                  {err}
                </p>
              )}
              <p className="note" style={{ marginTop: 12, textAlign: 'center' }}>
                <a onClick={() => { setMode('magic'); setErr('') }} style={{ cursor: 'pointer', color: 'var(--accent)' }}>
                  Use a magic link instead
                </a>
              </p>
            </form>
          ) : (
            <form onSubmit={send}>
              <h2>Magic-link login</h2>
              <label className="f">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seanculleton02@gmail.com"
                />
              </label>
              <button className="primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Sending…' : 'Send me a login link'}
              </button>
              {err && (
                <p className="note" style={{ color: 'var(--bad)', marginTop: 10 }}>
                  {err}
                </p>
              )}
              <p className="note" style={{ marginTop: 12, textAlign: 'center' }}>
                <a onClick={() => { setMode('password'); setErr('') }} style={{ cursor: 'pointer', color: 'var(--accent)' }}>
                  Sign in with a password instead
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
