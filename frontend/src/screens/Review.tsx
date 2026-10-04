import { useRef, useState } from 'react'
import { gradeChapter, type Chapter, type GradeResult, type ReviewMode, type TranscriptTurn } from '../api/client'
import { useCountdown } from '../hooks/useCountdown'
import { formatTime } from '../lib/timer'
import { TextReview } from '../review/TextReview'
import Results from './Results'

interface Props {
  chapter: Chapter
  seconds: number
  hasNotes: boolean
  onFinish: () => void
}

export default function Review({ chapter, seconds, hasNotes, onFinish }: Props) {
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
      setResults(await gradeChapter(chapter.id, mode, await review.current.end()))
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
    <p className="text-right font-mono text-sm text-slate-400">
      {left > 0 ? `Break: ${formatTime(left)}` : 'Break time is up. Finish when you are ready.'}
    </p>
  )

  if (!mode)
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        {timer}
        <h1 className="text-3xl font-bold">Review break</h1>
        <p className="mt-1 text-slate-400">Pick your challenge.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button onClick={() => begin('quiz')} className="rounded bg-slate-800 p-6 text-left hover:bg-slate-700">
            <h2 className="text-xl font-semibold">Quiz</h2>
            <p className="mt-1 text-sm text-slate-400">The Guide asks you three questions.</p>
          </button>
          <button
            onClick={() => begin('teachback')}
            disabled={!chapter.misconception}
            className="rounded bg-slate-800 p-6 text-left hover:bg-slate-700 disabled:opacity-40"
          >
            <h2 className="text-xl font-semibold">Teach-back</h2>
            <p className="mt-1 text-sm text-slate-400">
              {chapter.misconception
                ? 'A confused apprentice needs your correction.'
                : 'Unavailable for this chapter.'}
            </p>
          </button>
        </div>
      </div>
    )

  return (
    <div className="mx-auto max-w-2xl p-6">
      {timer}
      <h1 className="text-2xl font-bold">{mode === 'quiz' ? 'Quiz' : 'Teach-back'}</h1>

      <ul className="mt-4 space-y-3">
        {turns.map((t, i) => (
          <li
            key={i}
            className={`whitespace-pre-line rounded p-3 ${t.role === 'student' ? 'ml-12 bg-indigo-700' : 'mr-12 bg-slate-800'}`}
          >
            {t.text}
          </li>
        ))}
        {busy && <li className="text-slate-400">…</li>}
      </ul>

      {error && <p className="mt-4 rounded bg-red-900/50 p-3 text-red-200">{error}</p>}

      {results ? (
        <Results results={results} hasNotes={hasNotes} onFinish={onFinish} />
      ) : done ? (
        <div className="mt-6">
          <p className="text-slate-300">Review complete.</p>
          <button
            onClick={grade}
            disabled={busy}
            className="mt-4 rounded bg-indigo-600 px-5 py-2 font-semibold disabled:opacity-40"
          >
            {busy ? 'Grading…' : error ? 'Retry grading' : 'See results'}
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            disabled={busy || turns.length === 0}
            placeholder="Your answer"
            className="w-full rounded bg-slate-800 p-3"
          />
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="rounded bg-indigo-600 px-5 py-2 font-semibold disabled:opacity-40"
            >
              Send
            </button>
            {mode === 'quiz' && turns.length > 0 && (
              <button
                onClick={() => run(() => review.current.skip())}
                disabled={busy}
                className="text-sm text-slate-400 underline disabled:opacity-40"
              >
                Skip question
              </button>
            )}
            {mode === 'teachback' && turns.length > 1 && (
              <button
                onClick={() => {
                  review.current.finish()
                  setDone(true)
                }}
                className="text-sm text-slate-400 underline"
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
