import type { Settings } from '../lib/timer'

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
}

export default function SettingsPanel({ settings, onChange }: Props) {
  const num = (key: 'focusMin' | 'breakMin') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (v > 0) onChange({ ...settings, [key]: v })
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 rounded bg-slate-800 p-3 text-sm">
      <label className="flex items-center gap-2">
        Focus (min)
        <input type="number" min={1} value={settings.focusMin} onChange={num('focusMin')} disabled={settings.demo}
          className="w-16 rounded bg-slate-700 p-1 disabled:opacity-40" />
      </label>
      <label className="flex items-center gap-2">
        Break (min)
        <input type="number" min={1} value={settings.breakMin} onChange={num('breakMin')} disabled={settings.demo}
          className="w-16 rounded bg-slate-700 p-1 disabled:opacity-40" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={settings.demo} onChange={(e) => onChange({ ...settings, demo: e.target.checked })} />
        Demo mode (20s / 15s)
      </label>
    </div>
  )
}
