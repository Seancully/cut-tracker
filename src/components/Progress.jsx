import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { supabase } from '../lib/supabase'

export default function Progress({ user }) {
  const [rows, setRows] = useState([])
  const [goal, setGoal] = useState(null)

  useEffect(() => {
    ;(async () => {
      const [{ data: w }, { data: s }] = await Promise.all([
        supabase.from('weigh_ins').select('day,weight').eq('user_id', user.id).order('day', { ascending: true }),
        supabase.from('settings').select('goal_weight').eq('user_id', user.id).maybeSingle(),
      ])
      setRows(w || [])
      if (s?.goal_weight) setGoal(parseFloat(s.goal_weight))
    })()
  }, [user.id])

  const data = withRollingAvg(rows)
  const stats = computeStats(data, goal)

  const start = data.length ? data[0].weight : null
  const current = stats.avg7 ?? (data.length ? data[data.length - 1].weight : null)
  const lost = start != null && current != null ? start - current : null
  const toGo = current != null && goal ? current - goal : null
  const cutPct =
    start != null && goal && start > goal
      ? Math.min(100, Math.max(0, ((start - current) / (start - goal)) * 100))
      : null

  return (
    <>
      <div className="card span2">
        <h2>Cut progress {cutPct != null && <span className="tag">{Math.round(cutPct)}%</span>}</h2>
        {start != null ? (
          <>
            <div className="cutbar">
              <i style={{ width: `${cutPct || 0}%` }} />
            </div>
            <div className="cutmeta">
              <span><b>{start.toFixed(1)}</b><s>start</s></span>
              <span className="hl"><b>{current.toFixed(1)}</b><s>now</s></span>
              <span><b>{goal ?? '—'}</b><s>goal</s></span>
            </div>
            <p className="note" style={{ marginTop: 12 }}>
              {lost > 0 ? <b style={{ color: 'var(--good)' }}>{lost.toFixed(1)}kg down</b> : 'Logging…'}
              {toGo != null && goal ? ` · ${Math.max(0, toGo).toFixed(1)}kg to goal` : ''}
            </p>
          </>
        ) : (
          <p className="note">Log weigh-ins and set a goal on the Dashboard to see your overall cut progress.</p>
        )}
      </div>

      <div className="card span2">
        <h2>Trend</h2>
        <div className="stats">
          <div className="stat"><div className="n accent">{stats.latest ?? '–'}</div><div className="l">Latest kg</div></div>
          <div className="stat"><div className="n">{stats.avg7 ?? '–'}</div><div className="l">7-day avg</div></div>
          <div className="stat"><div className={'n ' + (stats.rate < 0 ? 'good' : '')}>{stats.rateLabel}</div><div className="l">kg / week</div></div>
        </div>
        <p className="note" style={{ marginTop: 12 }}>
          The <b style={{ color: 'var(--accent)' }}>lime line</b> is your 7-day average — the honest signal.
          The faint dots are daily weight (mostly water). Judge progress by the line, never a single day.
        </p>
      </div>

      <div className="card span2">
        <h2>Weight over time</h2>
        {data.length < 2 ? (
          <p className="note">Log a few daily weigh-ins on the Dashboard and your graph builds here.</p>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#262b34" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#828d9c', fontSize: 11 }} tickFormatter={shortDate} minTickGap={28} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: '#828d9c', fontSize: 11 }} width={44} />
                <Tooltip
                  contentStyle={{ background: '#15181e', border: '1px solid #262b34', borderRadius: 10, color: '#eef1f5', fontFamily: 'Space Grotesk' }}
                  labelFormatter={shortDate}
                />
                <Line type="monotone" dataKey="weight" stroke="#3a4150" strokeWidth={1} dot={{ r: 2, fill: '#3a4150' }} name="Daily" />
                <Line type="monotone" dataKey="avg" stroke="#c9f64f" strokeWidth={2.5} dot={false} name="7-day avg" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card span2">
        <h2>Projection</h2>
        {stats.eta ? (
          <p className="big" style={{ fontSize: 15 }}>
            At your current trend (<b>{stats.rateLabel} kg/wk</b>) you'd hit <b>{goal}kg</b> around{' '}
            <b style={{ color: 'var(--good)' }}>{stats.eta}</b> — about <b>{stats.weeks}</b> weeks out.
          </p>
        ) : (
          <p className="note">
            Set a goal weight on the Dashboard and log ~2 weeks of weigh-ins to get a projected date.
            {goal && stats.rate >= 0 ? ' (Trend is flat/up right now — that\'s usually stress water, not stalled fat loss.)' : ''}
          </p>
        )}
      </div>
    </>
  )
}

function withRollingAvg(rows) {
  return rows.map((r, i) => {
    const window = rows.slice(Math.max(0, i - 6), i + 1)
    const avg = window.reduce((a, b) => a + Number(b.weight), 0) / window.length
    return { day: r.day, weight: Number(r.weight), avg: Math.round(avg * 100) / 100 }
  })
}

function computeStats(data, goal) {
  if (!data.length) return { rateLabel: '–' }
  const latest = data[data.length - 1].weight
  const avg7 = data[data.length - 1].avg
  // rate = change in 7-day avg over the last ~7 entries, scaled to per week
  let rate = 0
  if (data.length >= 8) {
    const prev = data[data.length - 8].avg
    rate = avg7 - prev // ~1 week of avg movement
  } else if (data.length >= 2) {
    const first = data[0].avg
    const days = Math.max(1, daysBetween(data[0].day, data[data.length - 1].day))
    rate = ((avg7 - first) / days) * 7
  }
  const rateLabel = (rate > 0 ? '+' : '') + rate.toFixed(2)

  let eta = null, weeks = null
  if (goal && rate < -0.03 && avg7 > goal) {
    weeks = Math.ceil((avg7 - goal) / Math.abs(rate))
    const d = new Date()
    d.setDate(d.getDate() + weeks * 7)
    eta = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return { latest, avg7, rate, rateLabel, eta, weeks }
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}
function shortDate(s) {
  const d = new Date(s)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
