import { useState } from 'react'
import type { Chapter } from '../api/client'
import { durationsSec, type Settings } from '../lib/timer'
import FunBreak from '../breaks/FunBreak'
import BreakChoice, { type BreakKind } from './BreakChoice'
import Focus from './Focus'
import Review from './Review'

type Phase = { name: 'focus' } | { name: 'choice' } | { name: 'break'; kind: BreakKind }

interface Props {
  chapter: Chapter
  settings: Settings
  hasNotes: boolean
  practice: boolean
  onFinish: () => void
  onAbandon: () => void
}

// Practice (demo breaks) skips focus, saves nothing, and finishing just exits.
export default function Session({ chapter, settings, hasNotes, practice, onFinish, onAbandon }: Props) {
  const [phase, setPhase] = useState<Phase>(practice ? { name: 'choice' } : { name: 'focus' })
  const secs = durationsSec(settings)
  const finish = practice ? onAbandon : onFinish
  const finishLabel = practice ? 'Back to roadmap' : 'Finish chapter'

  return (
    <>
      {practice && (
        <div className="mx-auto mt-4 flex max-w-5xl items-center justify-between rounded-lg border border-amber-300/30 bg-amber-900/20 px-4 py-2 text-sm text-amber-100">
          <span>Demo breaks: practice mode, nothing is saved.</span>
          <button onClick={onAbandon} className="underline-offset-4 hover:underline">
            Exit
          </button>
        </div>
      )}
      {phase.name === 'focus' ? (
        <Focus chapter={chapter} seconds={secs.focus} onDone={() => setPhase({ name: 'choice' })} onAbandon={onAbandon} />
      ) : phase.name === 'choice' ? (
        <BreakChoice onChoose={(kind) => setPhase({ name: 'break', kind })} />
      ) : phase.kind === 'review' ? (
        <Review
          chapter={chapter}
          seconds={secs.break}
          hasNotes={hasNotes}
          practice={practice}
          finishLabel={finishLabel}
          onFinish={finish}
        />
      ) : (
        <FunBreak seconds={secs.break} finishLabel={finishLabel} onFinish={finish} />
      )}
    </>
  )
}
