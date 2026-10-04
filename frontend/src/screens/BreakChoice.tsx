export type BreakKind = 'fun' | 'review'

export default function BreakChoice({ onChoose }: { onChoose: (kind: BreakKind) => void }) {
  const card = 'panel p-8 transition hover:-translate-y-1 hover:border-teal-300/50'
  return (
    <div className="mx-auto max-w-5xl p-6 text-center">
      <h1 className="rune-title text-4xl">Chapter Complete</h1>
      <p className="mt-2 text-violet-200/70">You have earned a rest. How will you spend it?</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <button onClick={() => onChoose('fun')} className={card}>
          <p className="text-4xl">🌙</p>
          <h2 className="mt-3 font-display text-2xl">Fun break</h2>
          <p className="mt-1 text-sm text-violet-200/70">Breathe with the sigil, or take free time.</p>
        </button>
        <button onClick={() => onChoose('review')} className={card}>
          <p className="text-4xl">📜</p>
          <h2 className="mt-3 font-display text-2xl">Review break</h2>
          <p className="mt-1 text-sm text-violet-200/70">Face a challenger on what you just studied.</p>
        </button>
      </div>
    </div>
  )
}
