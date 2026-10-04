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
  const input = 'w-16 rounded-md border border-violet-400/20 bg-indigo-950 p-1 text-center disabled:opacity-40'

  return (
    <div className="panel mt-6 flex flex-wrap items-center gap-5 p-4 text-sm text-violet-100/90">
      <label className="flex items-center gap-2">
        Focus (min)
        <input type="number" min={1} value={settings.focusMin} onChange={num('focusMin')} disabled={settings.demo} className={input} />
      </label>
      <label className="flex items-center gap-2">
        Break (min)
        <input type="number" min={1} value={settings.breakMin} onChange={num('breakMin')} disabled={settings.demo} className={input} />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.demo}
          onChange={(e) => onChange({ ...settings, demo: e.target.checked })}
          className="accent-teal-400"
        />
        Demo mode (20s / 15s)
      </label>
    </div>
  )
}
