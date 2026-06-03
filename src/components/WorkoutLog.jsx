import { useEffect, useRef, useState } from 'react'
import { supabase, todayStr } from '../lib/supabase'
import RestTimer from './RestTimer.jsx'
import { buzz } from '../lib/haptics'
import { toast } from '../lib/toast'

export default function WorkoutLog({ user }) {
  const day = todayStr()
  const [workoutId, setWorkoutId] = useState(null)
  const [label, setLabel] = useState('')
  const [sets, setSets] = useState([])
  const [ex, setEx] = useState('')
  const [reps, setReps] = useState('')
  const [wt, setWt] = useState('')
  const [history, setHistory] = useState([])
  const [lastHint, setLastHint] = useState(null)
  const hintTimer = useRef(null)
  const [cardio, setCardio] = useState([])
  const [cardioWk, setCardioWk] = useState(0)
  const [cmin, setCmin] = useState('')
  const [ckind, setCkind] = useState('')

  useEffect(() => {
    let active = true
    const wkCutoff = todayStr(new Date(Date.now() - 6 * 86400000))
    ;(async () => {
      const { data: w } = await supabase
        .from('workouts').select('*').eq('user_id', user.id).eq('day', day).maybeSingle()
      if (!active) return
      if (w) {
        setWorkoutId(w.id)
        setLabel(w.label || '')
        const { data: s } = await supabase
          .from('workout_sets').select('*').eq('workout_id', w.id).order('position', { ascending: true })
        if (active) setSets(s || [])
      }
      const [{ data: cd }, { data: cw }] = await Promise.all([
        supabase.from('cardio_logs').select('*').eq('user_id', user.id).eq('day', day).order('created_at', { ascending: true }),
        supabase.from('cardio_logs').select('minutes').eq('user_id', user.id).gte('day', wkCutoff),
      ])
      if (active) {
        setCardio(cd || [])
        setCardioWk((cw || []).reduce((a, r) => a + (r.minutes || 0), 0))
      }
      loadHistory()
    })()
    return () => { active = false }
  }, [user.id, day])

  async function logCardio(e) {
    e.preventDefault()
    const m = parseInt(cmin)
    if (!m || m <= 0) return
    const row = { user_id: user.id, day, minutes: m, kind: ckind.trim() || null }
    const { data, error } = await supabase.from('cardio_logs').insert(row).select().single()
    if (error) { toast(error.message, 'bad'); return }
    setCardio([...cardio, data])
    setCardioWk((w) => w + m)
    setCmin('')
    buzz()
    toast(`Cardio · ${m} min logged 🏃`, 'ok')
    // logging cardio also ticks the daily cardio habit (merge-update, keeps other checks)
    supabase.from('daily_checks').upsert({ user_id: user.id, day, cardio: true }, { onConflict: 'user_id,day' })
  }

  async function delCardio(id) {
    const gone = cardio.find((c) => c.id === id)
    await supabase.from('cardio_logs').delete().eq('id', id)
    setCardio(cardio.filter((c) => c.id !== id))
    if (gone) setCardioWk((w) => Math.max(0, w - (gone.minutes || 0)))
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('workouts').select('id,day,label,workout_sets(exercise,reps,weight,position)')
      .eq('user_id', user.id).neq('day', day).order('day', { ascending: false }).limit(6)
    setHistory(data || [])
  }

  async function ensureWorkout() {
    if (workoutId) return workoutId
    const { data } = await supabase
      .from('workouts').insert({ user_id: user.id, day, label }).select().single()
    setWorkoutId(data.id)
    return data.id
  }

  async function addSet(e) {
    e.preventDefault()
    if (!ex.trim()) return
    const id = await ensureWorkout()
    const row = {
      workout_id: id, user_id: user.id, exercise: ex.trim(),
      reps: reps ? parseInt(reps) : null, weight: wt ? parseFloat(wt) : null,
      position: sets.length,
    }
    const { data } = await supabase.from('workout_sets').insert(row).select().single()
    setSets([...sets, data])
    buzz()
    toast(`${row.exercise} · ${row.reps ?? '–'}×${row.weight ?? '–'}kg`, 'ok')
    // keep exercise, reps & weight so you can hit Add again for the next set
    // of the same lift instantly (e.g. 3×10 @ 80kg = tap Add three times)
  }

  const onReps = (v) => setReps(v.replace(/[^0-9]/g, ''))
  const onWt = (v) => setWt(v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))

  async function delSet(id) {
    await supabase.from('workout_sets').delete().eq('id', id)
    setSets(sets.filter((s) => s.id !== id))
  }

  async function saveLabel(v) {
    setLabel(v)
    if (workoutId) await supabase.from('workouts').update({ label: v }).eq('id', workoutId)
  }

  // "last time / PR" lookup for the exercise being typed
  function onExChange(v) {
    setEx(v)
    clearTimeout(hintTimer.current)
    if (!v.trim()) { setLastHint(null); return }
    hintTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('workout_sets').select('weight,reps,created_at')
        .eq('user_id', user.id).ilike('exercise', v.trim())
        .order('created_at', { ascending: false }).limit(50)
      if (!data || !data.length) { setLastHint(null); return }
      const last = data[0]
      const pr = data.reduce((m, r) => (r.weight > (m?.weight ?? -1) ? r : m), null)
      setLastHint({ last, pr })
    }, 350)
  }

  const exNames = [
    ...new Set([
      ...history.flatMap((w) => (w.workout_sets || []).map((s) => s.exercise)),
      ...sets.map((s) => s.exercise),
    ]),
  ].filter(Boolean)

  const cardioToday = cardio.reduce((a, c) => a + (c.minutes || 0), 0)

  return (
    <>
      <div className="card">
        <h2>Cardio <span className="tag">{cardioToday} min today</span></h2>
        <form onSubmit={logCardio} className="setline">
          <input
            className="sm"
            type="text"
            inputMode="numeric"
            value={cmin}
            onChange={(e) => setCmin(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="min"
          />
          <input
            className="ex"
            value={ckind}
            onChange={(e) => setCkind(e.target.value)}
            placeholder="type — treadmill, walk, bike…"
          />
          <button className="primary" type="submit">Log</button>
        </form>
        <div className="stats" style={{ marginTop: 14 }}>
          <div className="stat"><div className="n accent">{cardioToday}</div><div className="l">min today</div></div>
          <div className="stat"><div className="n">{cardioWk}</div><div className="l">min · 7 days</div></div>
          <div className="stat"><div className="n">{cardio.length}</div><div className="l">sessions today</div></div>
        </div>
        {cardio.length > 0 ? (
          <div style={{ marginTop: 8 }}>
            {cardio.map((c) => (
              <div className="setrow" key={c.id}>
                <span className="sval">{c.minutes} min{c.kind ? ` · ${c.kind}` : ''}</span>
                <span className="x" onClick={() => delCardio(c.id)} title="Delete">✕</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="note" style={{ marginTop: 10 }}>Log warm-up or steady-state cardio here — minutes roll up to a weekly total and tick your daily cardio habit.</p>
        )}
      </div>

      <RestTimer />

      <datalist id="exList">
        {exNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div className="card">
        <h2>Today's session · {day}</h2>
        <label className="f">
          Label (optional — e.g. Push, Pull, Legs)
          <input value={label} onChange={(e) => saveLabel(e.target.value)} placeholder="Push" />
        </label>

        <form onSubmit={addSet}>
          <div className="setline">
            <input className="ex" list="exList" value={ex} onChange={(e) => onExChange(e.target.value)} placeholder="Exercise" />
            <input className="sm" type="text" inputMode="numeric" value={reps} onChange={(e) => onReps(e.target.value)} placeholder="reps" />
            <input className="sm" type="text" inputMode="decimal" value={wt} onChange={(e) => onWt(e.target.value)} placeholder="kg" />
            <button className="primary" type="submit">Add</button>
          </div>
        </form>
        {lastHint && (
          <p className="lastTime">
            Last time: {fmt(lastHint.last)} · <span className="pr">PR {fmt(lastHint.pr)}</span>
          </p>
        )}

        {sets.length === 0 && <p className="note">No sets yet. Type an exercise, reps &amp; weight, hit Add. The values stay put — tap Add again for each set (3×10 @ 80kg = three taps).</p>}
        {groupByExercise(sets).map(([exercise, list]) => (
          <div className="exgroup" key={exercise}>
            <div className="head">
              <b>{exercise}</b>
              <span className="vol">{list.length} {list.length === 1 ? 'set' : 'sets'} · {volume(list)} kg</span>
            </div>
            {list.map((s, i) => (
              <div className="setrow" key={s.id}>
                <span className="snum">SET {i + 1}</span>
                <span className="sval">{s.reps ?? '–'} reps × {s.weight ?? '–'} kg</span>
                <span className="x" onClick={() => delSet(s.id)} title="Delete">✕</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Recent sessions</h2>
        {history.length === 0 && <p className="note">Your past workouts will show here.</p>}
        {history.map((w) => (
          <div key={w.id} style={{ marginBottom: 14 }}>
            <h3 className="day">{w.day}{w.label ? ` · ${w.label}` : ''}</h3>
            {summarise(w.workout_sets).map((line, i) => (
              <div className="setrow" key={i}><span className="sval">{line}</span></div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

function fmt(s) {
  if (!s) return '–'
  return `${s.weight ?? '–'}kg × ${s.reps ?? '–'}`
}
function volume(list) {
  return list.reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.weight) || 0), 0)
}
function groupByExercise(sets) {
  const map = new Map()
  for (const s of sets) {
    if (!map.has(s.exercise)) map.set(s.exercise, [])
    map.get(s.exercise).push(s)
  }
  return [...map.entries()]
}
function summarise(sets = []) {
  const groups = groupByExercise(sets)
  return groups.map(([ex, list]) => {
    const best = list.reduce((m, r) => ((r.weight ?? 0) > (m?.weight ?? -1) ? r : m), null)
    return `${ex} — ${list.length} sets, top ${best?.weight ?? '–'}kg × ${best?.reps ?? '–'}`
  })
}
