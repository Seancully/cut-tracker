import { useEffect, useState } from 'react'
import { subscribe } from '../lib/toast'

export default function Toaster() {
  const [items, setItems] = useState([])
  useEffect(
    () =>
      subscribe((t) => {
        setItems((x) => [...x, t])
        setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 2100)
      }),
    []
  )
  return (
    <div className="toaster">
      {items.map((t) => (
        <div key={t.id} className={'toast ' + t.type}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
