import { useEffect, useState } from 'react'
import { breathAt, dotPosition } from '../lib/breathing'

const SIDE = 240

export default function BoxBreathing() {
  const [ms, setMs] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      setMs(now - start)
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const b = breathAt(ms)
  const dot = dotPosition(b.side, b.progress)

  return (
    <div className="relative mx-auto" style={{ width: SIDE, height: SIDE }}>
      <div className="absolute inset-0 rounded-md border-2 border-violet-300/40 shadow-[0_0_30px_-6px_rgba(167,139,250,0.7),inset_0_0_30px_-10px_rgba(94,234,212,0.5)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-3xl text-violet-100">{b.label}</p>
        <p className="mt-1 font-mono text-5xl text-teal-200">{b.count}</p>
      </div>
      <div
        className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200 shadow-[0_0_18px_6px_rgba(94,234,212,0.8)]"
        style={{ left: dot.x * SIDE, top: dot.y * SIDE }}
      />
    </div>
  )
}
