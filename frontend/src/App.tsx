import { useEffect, useState } from 'react'
import { getCampaign, updateChapterStatus, type Campaign, type Chapter } from './api/client'
import { loadSettings, saveSettings } from './lib/settings'
import type { Settings } from './lib/timer'
import Notes from './screens/Notes'
import Roadmap from './screens/Roadmap'
import Session from './screens/Session'

const KEY = 'campaignId'

export default function App() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [active, setActive] = useState<Chapter | null>(null)
  const [practice, setPractice] = useState(false)
  const [loading, setLoading] = useState(() => !!localStorage.getItem(KEY))

  // Reload restores the saved campaign from the database; it never calls the model.
  useEffect(() => {
    const id = localStorage.getItem(KEY)
    if (!id) return
    getCampaign(id)
      .then(setCampaign)
      .catch(() => localStorage.removeItem(KEY))
      .finally(() => setLoading(false))
  }, [])

  function created(c: Campaign) {
    localStorage.setItem(KEY, c.id)
    setCampaign(c)
  }

  function changeSettings(s: Settings) {
    setSettings(s)
    saveSettings(s)
  }

  async function finishChapter() {
    if (!campaign || !active) return
    try {
      await updateChapterStatus(active.id, 'done')
      setCampaign(await getCampaign(campaign.id))
    } finally {
      setActive(null)
    }
  }

  function start(chapter: Chapter, isPractice: boolean) {
    setPractice(isPractice)
    setActive(chapter)
  }

  function startNew() {
    localStorage.removeItem(KEY)
    setCampaign(null)
  }

  return (
    <div className="min-h-screen text-violet-50">
      <header className="mx-auto flex max-w-5xl items-center gap-2 px-6 pt-5">
        <img src="/crystal.svg" alt="" className="h-7 w-7 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
        <span className="font-display text-sm tracking-[0.2em] text-violet-200/90">QUEST-MODE STUDY</span>
      </header>
      {loading ? (
        <p className="p-6 text-violet-300/70">Loading…</p>
      ) : campaign && active ? (
        <Session
          chapter={active}
          settings={settings}
          hasNotes={campaign.has_notes}
          practice={practice}
          onFinish={finishChapter}
          onAbandon={() => setActive(null)}
        />
      ) : campaign ? (
        <Roadmap
          campaign={campaign}
          settings={settings}
          onSettings={changeSettings}
          onStart={(ch) => start(ch, false)}
          onDemoBreaks={(ch) => start(ch, true)}
          onNew={startNew}
        />
      ) : (
        <Notes onCreated={created} />
      )}
    </div>
  )
}
