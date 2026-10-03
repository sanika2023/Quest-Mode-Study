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
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">Begin a quest</h1>
      <p className="mt-1 text-slate-400">Turn your notes into a campaign. One chapter per study block.</p>

      <div className="mt-6 flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded px-3 py-1.5 text-sm ${mode === m.id ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}
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
            className="w-full rounded bg-slate-800 p-3"
          />
        )}
        {mode === 'pdf' && (
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded bg-slate-800 p-3"
          />
        )}
        {mode === 'topic' && (
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Cell biology"
            className="w-full rounded bg-slate-800 p-3"
          />
        )}
        {mode === 'topic' && (
          <p className="mt-1 text-xs text-slate-500">Without notes, results are not checked against your material.</p>
        )}
      </div>

      <label className="mt-6 block text-sm text-slate-400">Session length</label>
      <select
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
        className="mt-1 rounded bg-slate-800 p-2"
      >
        {LENGTHS.map((m) => (
          <option key={m} value={m}>
            {m} min ({m / MINUTES_PER_CHAPTER} {m === MINUTES_PER_CHAPTER ? 'chapter' : 'chapters'})
          </option>
        ))}
      </select>

      {error && <p className="mt-4 rounded bg-red-900/50 p-3 text-red-200">{error}</p>}

      <button
        onClick={submit}
        disabled={!ready || busy}
        className="mt-6 rounded bg-indigo-600 px-5 py-2 font-semibold disabled:opacity-40"
      >
        {busy ? 'Forging your campaign… (up to a minute)' : 'Generate campaign'}
      </button>
    </div>
  )
}
