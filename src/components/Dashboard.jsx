import { useEffect, useRef, useState } from 'react'
import { supabase, todayStr } from '../lib/supabase'
import { buzz } from '../lib/haptics'
import { toast } from '../lib/toast'
import { celebrate } from '../lib/confetti'

const CHECKS = [
  ['yog', 'High-protein yoghurt bowl', 'sets the day off — high protein, low cals'],
  ['cal', 'Hit calorie target', 'weighed/logged everything — oils & sauces too'],
  ['pro', 'Hit protein target', '~180g — anchor every meal around it'],
  ['creatine', 'Creatine', '5g daily — consistency over timing'],
  ['cardio', 'Cardio done — treadmill', 'if training day'],
  ['water', '3L+ water', ''],
  ['sleep', '7+ hrs sleep', 'low sleep = high cortisol = stuck scale'],
  ['stress', '10 min stress decompression', 'this IS fat-loss work right now'],
  ['weigh', 'Weighed in (fasted)', ''],
]

const CIRC = 2 * Math.PI * 40 // ring circumference (r=40)

const PHASES = {
  break: ['Diet Break', 'Eat ~2,600–2,700 (maintenance), protein high. Drops cortisol & water, resets your head. Scale often jumps DOWN right after.'],
  cut: ['Active Cut', '~2,100–2,200, weigh your food, protein ~180g. Aim ~0.5–0.75kg/wk off the weekly average.'],
  hold: ['Maintenance / Deload', 'Maintenance + lighter training every 6–8 weeks so fatigue & stress clear.'],
}

export default function Dashboard({ user }) {
  const [settings, setSettings] = useState({})
  const [checks, setChecks] = useState({})
  const [weight, setWeight] = useState('')
  const [hist, setHist] = useState([])
  const day = todayStr()
  const saveTimer = useRef(null)

  useEffect(() => {
    let active = true
    const cutoff = todayStr(new Date(Date.now() - 32 * 86400000))
    ;(async () => {
      const [s, c, w, h] = await Promise.all([
        supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('daily_checks').select('*').eq('user_id', user.id).eq('day', day).maybeSingle(),
        supabase.from('weigh_ins').select('weight').eq('user_id', user.id).eq('day', day).maybeSingle(),
        supabase.from('daily_checks').select('*').eq('user_id', user.id).gte('day', cutoff),
      ])
      if (!active) return
      if (s.data) setSettings(s.data)
      if (c.data) setChecks(c.data)
      if (w.data) setWeight(String(w.data.weight))
      if (h.data) setHist(h.data)
    })()
    return () => { active = false }
  }, [user.id, day])

  function saveSettings(next) {
    setSettings(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase.from('settings').upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() })
    }, 600)
  }

  async function toggle(key) {
    const next = { ...checks, [key]: !checks[key] }
    setChecks(next)
    buzz()
    const doneNext = CHECKS.filter(([k]) => next[k]).length
    if (doneNext === CHECKS.length && done < CHECKS.length) {
      celebrate()
      toast('All habits done — great day 🔥')
    }
    await supabase.from('daily_checks').upsert(
      { user_id: user.id, day, ...stripMeta(next) },
      { onConflict: 'user_id,day' }
    )
  }

  function saveWeight(v) {
    // allow free typing: keep only digits and a single decimal point
    const clean = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    setWeight(clean)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const num = parseFloat(clean)
      if (!isNaN(num)) {
        supabase
          .from('weigh_ins')
          .upsert({ user_id: user.id, day, weight: num }, { onConflict: 'user_id,day' })
          .then(() => toast(`Weight saved · ${num}kg`))
      }
    }, 700)
  }

  const done = CHECKS.filter(([k]) => checks[k]).length
  const momentum = computeMomentum(hist, checks, day)

  return (
    <>
      <div className="card hero span2">
        <div className="ring">
          <svg viewBox="0 0 100 100">
            <defs>
              <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#c9f64f" />
                <stop offset="1" stopColor="#5cc8ff" />
              </linearGradient>
            </defs>
            <circle className="track" cx="50" cy="50" r="40" />
            <circle
              className="bar"
              cx="50"
              cy="50"
              r="40"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - done / CHECKS.length)}
            />
          </svg>
          <div className="lab">
            <b>{done}</b>
            <s>of {CHECKS.length}</s>
          </div>
        </div>
        <div className="heroMeta">
          <span className="lab">This morning</span>
          <div className="weighIn">
            <input
              className="bigweight"
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => saveWeight(e.target.value)}
              placeholder="87.95"
            />
            <span className="unit">kg</span>
          </div>
          <span className="hint">
            {done === CHECKS.length
              ? 'All habits done — great day 💪'
              : `${CHECKS.length - done} habit${CHECKS.length - done > 1 ? 's' : ''} left today`}
          </span>
        </div>
      </div>

      <div className="card span2">
        <h2>Momentum</h2>
        <div className="stats">
          <div className="stat">
            <div className="n accent">{momentum.streak}</div>
            <div className="l">🔥 Day streak</div>
          </div>
          <div className="stat">
            <div className={'n ' + (momentum.adherence >= 80 ? 'good' : '')}>{momentum.adherence}%</div>
            <div className="l">7-day adherence</div>
          </div>
          <div className="stat">
            <div className="n">{momentum.logged}</div>
            <div className="l">Days logged</div>
          </div>
        </div>
      </div>

      <div className="card span2">
        <h2>Daily checklist <span className="tag">{done}/{CHECKS.length}</span></h2>
        <div className="checks">
          {CHECKS.map(([key, label, hint]) => (
            <div className="check" key={key}>
              <input id={key} type="checkbox" checked={!!checks[key]} onChange={() => toggle(key)} />
              <label htmlFor={key}>
                <span className="txt">{label}</span>
                {hint && <small>{hint}</small>}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Current phase</h2>
        <div className="phase">
          {Object.entries(PHASES).map(([k, [name]]) => (
            <button key={k} className={settings.phase === k ? 'on' : ''} onClick={() => saveSettings({ ...settings, phase: k })}>
              {name}
            </button>
          ))}
        </div>
        {settings.phase && <p className="note">{PHASES[settings.phase][1]}</p>}
      </div>

      <div className="card">
        <h2>My numbers</h2>
        <div className="row">
          <label className="f">Current (kg)
            <input type="number" step="0.1" value={settings.cur_weight ?? ''} onChange={(e) => saveSettings({ ...settings, cur_weight: e.target.value })} placeholder="88" />
          </label>
          <label className="f">Goal (kg)
            <input type="number" step="0.1" value={settings.goal_weight ?? ''} onChange={(e) => saveSettings({ ...settings, goal_weight: e.target.value })} placeholder="74" />
          </label>
        </div>
        <div className="row">
          <label className="f">kcal target
            <input type="number" value={settings.kcal ?? ''} onChange={(e) => saveSettings({ ...settings, kcal: e.target.value })} placeholder="2150" />
          </label>
          <label className="f">Protein (g)
            <input type="number" value={settings.protein ?? ''} onChange={(e) => saveSettings({ ...settings, protein: e.target.value })} placeholder="180" />
          </label>
          <label className="f">Cardio (min)
            <input type="number" value={settings.cardio ?? ''} onChange={(e) => saveSettings({ ...settings, cardio: e.target.value })} placeholder="35" />
          </label>
        </div>
        <p className="note">After the diet break, set kcal ~2,100–2,200 — not lower. You're already lean &amp; stressed; deeper cuts spike cortisol.</p>
      </div>

      <div className="card span2">
        <h2>Brain dump</h2>
        <textarea value={settings.notes ?? ''} onChange={(e) => saveSettings({ ...settings, notes: e.target.value })} placeholder="Stress, energy, training, what's working…" />
      </div>
    </>
  )
}

// keep only the boolean check columns when upserting
function stripMeta(obj) {
  const keys = CHECKS.map(([k]) => k)
  const out = {}
  for (const k of keys) out[k] = !!obj[k]
  return out
}

const countTrue = (r) => CHECKS.reduce((a, [k]) => a + (r && r[k] ? 1 : 0), 0)

// streak (days with >= 7/9 habits), 7-day adherence %, total days logged
function computeMomentum(hist, todayChecks, todayKey) {
  const T = 7
  const byDay = new Map()
  for (const r of hist) byDay.set(r.day, countTrue(r))
  byDay.set(todayKey, countTrue(todayChecks)) // live value for today

  let streak = 0
  const d = new Date()
  if ((byDay.get(todayKey) || 0) < T) d.setDate(d.getDate() - 1) // today still in progress
  for (let i = 0; i < 400; i++) {
    if ((byDay.get(todayStr(d)) || 0) >= T) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }

  let sum = 0
  for (let i = 0; i < 7; i++) {
    sum += byDay.get(todayStr(new Date(Date.now() - i * 86400000))) || 0
  }
  const adherence = Math.round((sum / (7 * CHECKS.length)) * 100)
  const logged = [...byDay.values()].filter((v) => v > 0).length
  return { streak, adherence, logged }
}
