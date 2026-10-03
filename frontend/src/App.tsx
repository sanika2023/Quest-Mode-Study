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

  function startNew() {
    localStorage.removeItem(KEY)
    setCampaign(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {loading ? (
        <p className="p-6 text-slate-400">Loading…</p>
      ) : campaign && active ? (
        <Session chapter={active} settings={settings} onFinish={finishChapter} onAbandon={() => setActive(null)} />
      ) : campaign ? (
        <Roadmap campaign={campaign} settings={settings} onSettings={changeSettings} onStart={setActive} onNew={startNew} />
      ) : (
        <Notes onCreated={created} />
      )}
    </div>
  )
}
