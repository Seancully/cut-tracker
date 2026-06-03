import { useEffect, useRef, useState } from 'react'
import { buzz } from '../lib/haptics'
import { toast } from '../lib/toast'

const PRESETS = [60, 90, 120, 180]
const CIRC = 2 * Math.PI * 52

export default function RestTimer() {
  const [total, setTotal] = useState(90)
  const [left, setLeft] = useState(90)
  const [running, setRunning] = useState(false)
  const tick = useRef(null)

  useEffect(() => {
    if (!running) return
    tick.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(tick.current)
          setRunning(false)
          buzz([90, 60, 90])
          toast('Rest done — go 💥', 'ok')
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(tick.current)
  }, [running])

  function pick(s) {
    setTotal(s)
    setLeft(s)
    setRunning(true)
    buzz()
  }
  function toggle() {
    if (left === 0) setLeft(total)
    setRunning((r) => !r)
    buzz()
  }
  function reset() {
    setRunning(false)
    setLeft(total)
    buzz()
  }

  const mm = String(Math.floor(left / 60)).padStart(1, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = total ? left / total : 0

  return (
    <div className="card span2 timer">
      <div className="timerDial">
        <svg viewBox="0 0 120 120">
          <circle className="track" cx="60" cy="60" r="52" />
          <circle
            className="bar"
            cx="60"
            cy="60"
            r="52"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
          />
        </svg>
        <div className="timeLab">
          {mm}:{ss}
        </div>
      </div>
      <div className="timerCtl">
        <h2 style={{ margin: 0 }}>Rest timer</h2>
        <div className="presets">
          {PRESETS.map((s) => (
            <button key={s} className={total === s ? 'on' : ''} onClick={() => pick(s)}>
              {s < 120 ? `${s}s` : `${s / 60}m`}
            </button>
          ))}
        </div>
        <div className="timerBtns">
          <button className="primary" onClick={toggle}>
            {running ? 'Pause' : left === 0 ? 'Restart' : 'Start'}
          </button>
          <button className="ghost" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
