import { useRef, useState } from 'react'
import { gradeChapter, type Chapter, type GradeResult, type ReviewMode, type TranscriptTurn } from '../api/client'
import { CHARACTERS, type Character } from '../characters'
import { useCountdown } from '../hooks/useCountdown'
import { formatTime } from '../lib/timer'
import { TextReview } from '../review/TextReview'
import Portrait from './Portrait'
import Results from './Results'

interface Props {
  chapter: Chapter
  seconds: number
  hasNotes: boolean
  practice: boolean
  finishLabel: string
  onFinish: () => void
}

export default function Review({ chapter, seconds, hasNotes, practice, finishLabel, onFinish }: Props) {
  const left = useCountdown(seconds, () => {})
  const review = useRef(new TextReview())
  const [mode, setMode] = useState<ReviewMode | null>(null)
  const [turns, setTurns] = useState<TranscriptTurn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [results, setResults] = useState<GradeResult[] | null>(null)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
      setDone(review.current.done)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function grade() {
    if (!mode) return
    setBusy(true)
    setError('')
    try {
      setResults(await gradeChapter(chapter.id, mode, await review.current.end(), practice))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Grading failed')
    } finally {
      setBusy(false)
    }
  }

  function begin(m: ReviewMode) {
    setMode(m)
    setTurns([])
    review.current.onTurn((t) => setTurns((prev) => [...prev, t]))
    void run(() => review.current.start(chapter.id, m))
  }

  async function send() {
    const message = input.trim()
    if (!message) return
    await run(() => review.current.send(message))
    setInput('')
  }

  // The timer is informational; reaching zero never ends the review.
  const timer = (
    <p className="text-right font-mono text-sm text-teal-300/80">
      {left > 0 ? `⏳ ${formatTime(left)}` : 'Break time is up. Finish when you are ready.'}
    </p>
  )

  if (!mode)
    return (
      <div className="mx-auto max-w-5xl p-6 text-center">
        {timer}
        <h1 className="rune-title text-4xl">Review Break</h1>
        <p className="mt-2 text-violet-200/70">Two figures await. Choose who you face.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <CharacterCard
            character={CHARACTERS.quiz}
            mode="Quiz"
            blurb={`${CHARACTERS.quiz.name} will test you with three questions.`}
            onClick={() => begin('quiz')}
          />
          <CharacterCard
            character={CHARACTERS.teachback}
            mode="Teach-back"
            blurb={
              chapter.misconception
                ? `${CHARACTERS.teachback.name} got something wrong. Set them straight.`
                : 'Unavailable for this chapter.'
            }
            disabled={!chapter.misconception}
            onClick={() => begin('teachback')}
          />
        </div>
      </div>
    )

  const speaker = CHARACTERS[mode]

  return (
    <div className="mx-auto max-w-5xl p-6">
      {timer}
      <div className="flex items-center gap-4">
        <Portrait character={speaker} size="lg" />
        <div>
          <p className="label">{mode === 'quiz' ? 'Quiz' : 'Teach-back'}</p>
          <h1 className="rune-title text-3xl">{speaker.name}</h1>
          <p className="text-sm italic text-violet-200/60">{speaker.title}</p>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {turns.map((t, i) =>
          t.role === 'student' ? (
            <li key={i} className="ml-14 whitespace-pre-line rounded-xl rounded-br-sm bg-teal-700/40 p-3 border border-teal-300/20">
              {t.text}
            </li>
          ) : (
            <li key={i} className="mr-10 flex items-start gap-3">
              <Portrait character={speaker} />
              <p className="panel whitespace-pre-line rounded-tl-sm p-3">{t.text}</p>
            </li>
          ),
        )}
        {busy && <li className="ml-14 animate-pulse text-violet-300/70">✦ ✦ ✦</li>}
      </ul>

      {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-950/60 p-3 text-red-200">{error}</p>}

      {results ? (
        <Results results={results} hasNotes={hasNotes} practice={practice} finishLabel={finishLabel} onFinish={onFinish} />
      ) : done ? (
        <div className="mt-6">
          <p className="text-violet-200/80">The trial is over.</p>
          <button onClick={grade} disabled={busy} className="btn mt-4">
            {busy ? 'Consulting the scrolls…' : error ? 'Retry grading' : 'See results'}
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            disabled={busy || turns.length === 0}
            placeholder={mode === 'quiz' ? 'Your answer' : `Correct ${speaker.name}`}
            className="field w-full"
          />
          <div className="mt-2 flex items-center gap-4">
            <button onClick={send} disabled={busy || !input.trim()} className="btn">
              Send
            </button>
            {mode === 'quiz' && turns.length > 0 && (
              <button onClick={() => run(() => review.current.skip())} disabled={busy} className="btn-ghost">
                Skip question
              </button>
            )}
            {mode === 'teachback' && turns.length > 1 && (
              <button
                onClick={() => {
                  review.current.finish()
                  setDone(true)
                }}
                className="btn-ghost"
              >
                I'm done teaching
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface CardProps {
  character: Character
  mode: string
  blurb: string
  disabled?: boolean
  onClick: () => void
}

function CharacterCard({ character, mode, blurb, disabled, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="panel group flex flex-col items-center p-6 transition hover:-translate-y-1 hover:border-teal-300/50 disabled:pointer-events-none disabled:opacity-40"
    >
      <div className="animate-float">
        <Portrait character={character} size="lg" />
      </div>
      <p className="label mt-4">{mode}</p>
      <h2 className="font-display text-2xl text-violet-100">{character.name}</h2>
      <p className="text-xs italic text-violet-200/60">{character.title}</p>
      <p className="mt-3 text-sm text-violet-100/80">{blurb}</p>
    </button>
  )
}
