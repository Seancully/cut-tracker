import { useEffect, useState } from 'react'
import { supabase, hasConfig } from './lib/supabase'
import Auth from './components/Auth.jsx'
import Logo from './components/Logo.jsx'
import Toaster from './components/Toaster.jsx'
import Dashboard from './components/Dashboard.jsx'
import WorkoutLog from './components/WorkoutLog.jsx'
import Progress from './components/Progress.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dash')
  const [installEvt, setInstallEvt] = useState(null)

  useEffect(() => {
    if (!hasConfig) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setInstallEvt(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setInstallEvt(null))
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function install() {
    if (!installEvt) return
    installEvt.prompt()
    await installEvt.userChoice
    setInstallEvt(null)
  }

  if (!hasConfig) {
    return (
      <div className="wrap">
        <div className="authbox">
          <h1>Sean's Cut 🏋️</h1>
          <div className="card">
            <h2>Setup needed</h2>
            <p className="note">
              Add your Supabase keys before logging in. Copy{' '}
              <code>.env.example</code> to <code>.env</code>, paste your{' '}
              <b>Project URL</b> and <b>anon public key</b> (Supabase → Project
              Settings → API), then restart <code>npm run dev</code>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="spin">Loading…</div>
  if (!session) return <Auth />

  const user = session.user

  return (
    <div className="wrap">
      <div className="top">
        <div className="brand">
          <div className="logo"><Logo size={44} /></div>
          <div>
            <h1>Sean's Cut</h1>
            <p className="sub">→ 74kg &amp; leaner · keep stacking days</p>
          </div>
        </div>
        <div className="topbtns">
          {installEvt && (
            <button className="installbtn" onClick={install}>
              ↓ Install
            </button>
          )}
          <button className="signout" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'dash' ? 'on' : ''} onClick={() => setTab('dash')}>
          Dashboard
        </button>
        <button className={tab === 'workout' ? 'on' : ''} onClick={() => setTab('workout')}>
          Workout
        </button>
        <button className={tab === 'progress' ? 'on' : ''} onClick={() => setTab('progress')}>
          Progress
        </button>
      </div>

      <div className="view" key={tab}>
        {tab === 'dash' && <Dashboard user={user} />}
        {tab === 'workout' && <WorkoutLog user={user} />}
        {tab === 'progress' && <Progress user={user} />}
      </div>

      <Toaster />
    </div>
  )
}
