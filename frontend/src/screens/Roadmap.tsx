import type { Campaign, ChapterStatus } from '../api/client'

const BADGE: Record<ChapterStatus, string> = {
  locked: 'bg-slate-700 text-slate-300',
  active: 'bg-indigo-600 text-white',
  done: 'bg-emerald-700 text-white',
}

export default function Roadmap({ campaign, onNew }: { campaign: Campaign; onNew: () => void }) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">{campaign.title}</h1>
      <p className="mt-1 text-slate-400">{campaign.premise}</p>
      {!campaign.has_notes && <p className="mt-1 text-xs text-slate-500">Not checked against notes.</p>}

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
          </li>
        ))}
      </ol>

      <button onClick={onNew} className="mt-6 text-sm text-slate-400 underline">
        Start a new campaign
      </button>
    </div>
  )
}
