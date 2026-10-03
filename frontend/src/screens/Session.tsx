import { useState } from 'react'
import type { Chapter } from '../api/client'
import { durationsSec, type Settings } from '../lib/timer'
import BreakChoice, { type BreakKind } from './BreakChoice'
import BreakPlaceholder from './BreakPlaceholder'
import Focus from './Focus'

type Phase = { name: 'focus' } | { name: 'choice' } | { name: 'break'; kind: BreakKind }

interface Props {
  chapter: Chapter
  settings: Settings
  onFinish: () => void
  onAbandon: () => void
}

export default function Session({ chapter, settings, onFinish, onAbandon }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: 'focus' })
  const secs = durationsSec(settings)

  if (phase.name === 'focus')
    return (
      <Focus chapter={chapter} seconds={secs.focus} onDone={() => setPhase({ name: 'choice' })} onAbandon={onAbandon} />
    )
  if (phase.name === 'choice') return <BreakChoice onChoose={(kind) => setPhase({ name: 'break', kind })} />
  return <BreakPlaceholder kind={phase.kind} seconds={secs.break} onFinish={onFinish} />
}
