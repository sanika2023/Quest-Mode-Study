import type { Campaign, Chapter, ChapterStatus } from '../api/client'
import type { Settings } from '../lib/timer'
import SettingsPanel from './SettingsPanel'

const NODE: Record<ChapterStatus, string> = {
  locked: 'border-violet-400/30 bg-indigo-950 text-violet-300/50',
  active: 'border-teal-300 bg-teal-500/30 text-teal-100 shadow-[0_0_16px_2px_rgba(94,234,212,0.6)] animate-pulse',
  done: 'border-violet-300 bg-violet-500/40 text-violet-50',
}

const BADGE: Record<ChapterStatus, string> = {
  locked: '🔒 sealed',
  active: '✦ current quest',
  done: '✓ conquered',
}

interface Props {
  campaign: Campaign
  settings: Settings
  onSettings: (s: Settings) => void
  onStart: (chapter: Chapter) => void
  onDemoBreaks: (chapter: Chapter) => void
  onNew: () => void
}

export default function Roadmap({ campaign, settings, onSettings, onStart, onDemoBreaks, onNew }: Props) {
  // Practice uses the current chapter, or the last one once all are done.
  const demoChapter = campaign.chapters.find((c) => c.status === 'active') ?? campaign.chapters[campaign.chapters.length - 1]

  return (
    <div className="mx-auto max-w-5xl p-6">
      <p className="label">Campaign</p>
      <h1 className="rune-title text-4xl leading-tight">{campaign.title}</h1>
      <p className="mt-2 italic text-violet-200/70">{campaign.premise}</p>
      {!campaign.has_notes && <p className="mt-1 text-xs text-violet-300/50">Not checked against notes.</p>}

      <SettingsPanel settings={settings} onChange={onSettings} />

      <ol className="relative mt-8 space-y-5 border-l border-dashed border-violet-400/30 pl-8">
        {campaign.chapters.map((ch) => (
          <li key={ch.id} className="relative">
            <span
              className={`absolute -left-[3.05rem] top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-sm ${NODE[ch.status]}`}
            >
              {ch.position}
            </span>
            <div className={`panel p-5 ${ch.status === 'locked' ? 'opacity-50' : ''} ${ch.status === 'active' ? 'border-teal-300/40' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg text-violet-50">{ch.title}</h2>
                <span className="shrink-0 text-xs text-violet-300/80">{BADGE[ch.status]}</span>
              </div>
              <p className="mt-2 text-sm text-violet-100/70">{ch.story_beat}</p>
              {ch.villains.length > 0 && (
                <p className="mt-3 text-sm text-rose-300">
                  ☠ Villains lurking: {ch.villains.map((v) => v.name).join(', ')}
                </p>
              )}
              {ch.status === 'active' && (
                <button onClick={() => onStart(ch)} className="btn mt-4">
                  ⚔ Begin chapter
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex gap-6">
        <button onClick={onNew} className="btn-ghost">
          Start a new campaign
        </button>
        {demoChapter && (
          <button onClick={() => onDemoBreaks(demoChapter)} className="btn-ghost">
            Demo breaks
          </button>
        )}
      </div>
    </div>
  )
}
