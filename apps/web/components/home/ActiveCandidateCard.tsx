interface PropertyBar {
  label: string;
  value: number;
}

const properties: PropertyBar[] = [
  { label: 'Efficacy', value: 87 },
  { label: 'Safety', value: 76 },
  { label: 'ADMET', value: 82 },
  { label: 'Developability', value: 71 },
];

export default function ActiveCandidateCard() {
  return (
    <div
      className="rounded-xl border border-[var(--line)] p-5 mb-6 flex gap-6"
      style={{ background: 'var(--panel)' }}
    >
      {/* Left: candidate info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3
                className="text-xl font-semibold"
                style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
              >
                AX-7291
              </h3>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: 'var(--cyan-soft)', color: 'var(--blue-deep)' }}
              >
                Lead Optimisation
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--faint)' }}>Active candidate — sample data</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#E8F8F3' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--green)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              0.84 — High confidence
            </span>
          </div>
        </div>

        {/* Property bars */}
        <div className="space-y-2">
          {properties.map((prop) => (
            <div key={prop.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-xs" style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)' }}>
                  {prop.label}
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--ink)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                  {prop.value}%
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${prop.value}%`,
                    background: prop.value >= 80 ? 'var(--green)' : prop.value >= 70 ? 'var(--blue)' : 'var(--amber)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ background: 'var(--blue)', fontFamily: 'var(--font-inter)' }}
        >
          View full analysis
        </button>
      </div>

      {/* Right: 3D viewer placeholder */}
      <div
        className="w-52 flex-shrink-0 rounded-xl flex flex-col items-center justify-center border border-dashed border-[var(--line)] min-h-[180px]"
        style={{ background: 'var(--bg)' }}
      >
        {/* Three.js 3D viewer will be integrated in Phase 4 */}
        <div className="w-12 h-12 rounded-full border-2 border-[var(--line)] flex items-center justify-center mb-2">
          <div className="w-4 h-4 rounded-full" style={{ background: 'var(--faint)' }} />
        </div>
        <p className="text-xs text-center" style={{ color: 'var(--faint)', fontFamily: 'var(--font-inter)' }}>
          3D Viewer
        </p>
        <p className="text-[10px] text-center mt-0.5" style={{ color: 'var(--faint)' }}>
          Loading...
        </p>
        <p className="text-[9px] text-center mt-2 px-3" style={{ color: 'var(--line)' }}>
          Three.js integration — Phase 4
        </p>
      </div>
    </div>
  );
}
