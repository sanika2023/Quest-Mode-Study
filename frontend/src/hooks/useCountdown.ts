import { useEffect, useRef, useState } from 'react'
import { remainingSeconds } from '../lib/timer'

// Counts down from an end timestamp so background-tab throttling doesn't drift the clock.
export function useCountdown(seconds: number, onDone: () => void): number {
  const [left, setLeft] = useState(seconds)
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  })

  useEffect(() => {
    const endAt = Date.now() + seconds * 1000
    setLeft(seconds)
    const id = setInterval(() => {
      const r = remainingSeconds(endAt, Date.now())
      setLeft(r)
      if (r === 0) {
        clearInterval(id)
        doneRef.current()
      }
    }, 250)
    return () => clearInterval(id)
  }, [seconds])

  return left
}
