import type { Campaign, Chapter, ChapterStatus } from '../api/client'
import type { Settings } from '../lib/timer'
import SettingsPanel from './SettingsPanel'

const BADGE: Record<ChapterStatus, string> = {
  locked: 'bg-slate-700 text-slate-300',
  active: 'bg-indigo-600 text-white',
  done: 'bg-emerald-700 text-white',
}

interface Props {
  campaign: Campaign
  settings: Settings
  onSettings: (s: Settings) => void
  onStart: (chapter: Chapter) => void
  onNew: () => void
}

export default function Roadmap({ campaign, settings, onSettings, onStart, onNew }: Props) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">{campaign.title}</h1>
      <p className="mt-1 text-slate-400">{campaign.premise}</p>
      {!campaign.has_notes && <p className="mt-1 text-xs text-slate-500">Not checked against notes.</p>}

      <SettingsPanel settings={settings} onChange={onSettings} />

      <ol className="mt-6 space-y-3">
        {campaign.chapters.map((ch) => (
          <li
            key={ch.id}
            className={`rounded bg-slate-800 p-4 ${ch.status === 'locked' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                Chapter {ch.position}: {ch.title}
              </h2>
              <span className={`rounded px-2 py-0.5 text-xs ${BADGE[ch.status]}`}>{ch.status}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{ch.story_beat}</p>
            {ch.status === 'active' && (
              <button onClick={() => onStart(ch)} className="mt-3 rounded bg-indigo-600 px-4 py-1.5 text-sm font-semibold">
                Start chapter
              </button>
            )}
          </li>
        ))}
      </ol>

      <button onClick={onNew} className="mt-6 text-sm text-slate-400 underline">
        Start a new campaign
      </button>
    </div>
  )
}
