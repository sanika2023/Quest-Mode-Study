import { useState } from 'react'
import { createCampaign, type Campaign, type CampaignInput } from '../api/client'

type Mode = 'paste' | 'pdf' | 'topic'

const MINUTES_PER_CHAPTER = 30
const LENGTHS = [30, 60, 90, 120]
const MODES: { id: Mode; label: string }[] = [
  { id: 'paste', label: 'Paste notes' },
  { id: 'pdf', label: 'Upload PDF' },
  { id: 'topic', label: 'Just a topic' },
]

export default function Notes({ onCreated }: { onCreated: (c: Campaign) => void }) {
  const [mode, setMode] = useState<Mode>('paste')
  const [text, setText] = useState('')
  const [topic, setTopic] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [minutes, setMinutes] = useState(60)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const ready = mode === 'paste' ? text.trim() : mode === 'pdf' ? file : topic.trim()

  async function submit() {
    let input: CampaignInput
    if (mode === 'paste') input = { planned_minutes: minutes, notes_text: text }
    else if (mode === 'topic') input = { planned_minutes: minutes, topic }
    else input = { planned_minutes: minutes, file: file! }
    setBusy(true)
    setError('')
    try {
      onCreated(await createCampaign(input))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="rune-title text-5xl">Begin a Quest</h1>
      <p className="mt-2 text-violet-200/70">Offer your notes to the archive. Each study block becomes a chapter of your legend.</p>

      <div className="mt-8 flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              mode === m.id
                ? 'border-teal-300/60 bg-violet-600/50 text-white shadow-[0_0_12px_-2px_rgba(139,92,246,0.8)]'
                : 'border-violet-400/20 bg-indigo-950/60 text-violet-200/80 hover:border-violet-300/50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {mode === 'paste' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste your notes here"
            className="field w-full"
          />
        )}
        {mode === 'pdf' && (
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="field w-full file:mr-4 file:rounded-md file:border-0 file:bg-violet-600 file:px-3 file:py-1 file:text-white"
          />
        )}
        {mode === 'topic' && (
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Cell biology"
            className="field w-full"
          />
        )}
        {mode === 'topic' && (
          <p className="mt-1 text-xs text-violet-300/50">Without notes, results are not checked against your material.</p>
        )}
      </div>

      <label className="label mt-6 block">Session length</label>
      <select
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
        className="field mt-2 p-2"
      >
        {LENGTHS.map((m) => (
          <option key={m} value={m}>
            {m} min ({m / MINUTES_PER_CHAPTER} {m === MINUTES_PER_CHAPTER ? 'chapter' : 'chapters'})
          </option>
        ))}
      </select>

      {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-950/60 p-3 text-red-200">{error}</p>}

      <button onClick={submit} disabled={!ready || busy} className={`btn mt-8 block ${busy ? 'animate-pulse' : ''}`}>
        {busy ? 'Forging your campaign… (up to a minute)' : '✦ Forge campaign'}
      </button>
    </div>
  )
}
