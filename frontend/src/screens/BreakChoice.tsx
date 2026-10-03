export type BreakKind = 'fun' | 'review'

export default function BreakChoice({ onChoose }: { onChoose: (kind: BreakKind) => void }) {
  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-3xl font-bold">Chapter complete</h1>
      <p className="mt-1 text-slate-400">Choose how to spend your break.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button onClick={() => onChoose('fun')} className="rounded bg-slate-800 p-6 text-left hover:bg-slate-700">
          <h2 className="text-xl font-semibold">Fun break</h2>
          <p className="mt-1 text-sm text-slate-400">Rest and breathe.</p>
        </button>
        <button onClick={() => onChoose('review')} className="rounded bg-indigo-700 p-6 text-left hover:bg-indigo-600">
          <h2 className="text-xl font-semibold">Review break</h2>
          <p className="mt-1 text-sm text-indigo-200">Practice what you just studied.</p>
        </button>
      </div>
    </div>
  )
}
