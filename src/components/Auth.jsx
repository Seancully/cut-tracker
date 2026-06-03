import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Logo from './Logo.jsx'

export default function Auth() {
  const [email, setEmail] = useState('')
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
            </>
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
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
