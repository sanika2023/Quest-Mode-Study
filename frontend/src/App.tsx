import { useEffect, useState } from 'react'
import { getCampaign, type Campaign } from './api/client'
import Notes from './screens/Notes'
import Roadmap from './screens/Roadmap'

const KEY = 'campaignId'

export default function App() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
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

  function startNew() {
    localStorage.removeItem(KEY)
    setCampaign(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {loading ? (
        <p className="p-6 text-slate-400">Loading…</p>
      ) : campaign ? (
        <Roadmap campaign={campaign} onNew={startNew} />
      ) : (
        <Notes onCreated={created} />
      )}
    </div>
  )
}
