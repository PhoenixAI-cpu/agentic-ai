'use client';

import { MoleculeViewerLazy as MoleculeViewer3D } from '@/components/molecules/MoleculeViewerLazy';
import { useEngineCandidates } from '@/lib/useEngine';

interface PropertyBar {
  label: string;
  value: number;
  ci?: [number, number];
}

const sampleProperties: PropertyBar[] = [
  { label: 'Efficacy', value: 87 },
  { label: 'Safety', value: 76 },
  { label: 'ADMET', value: 82 },
  { label: 'Developability', value: 71 },
];

const PROP_KEYS = ['efficacy', 'safety', 'admet', 'developability'] as const;
const PROP_LABELS: Record<(typeof PROP_KEYS)[number], string> = {
  efficacy: 'Efficacy',
  safety: 'Safety',
  admet: 'ADMET',
  developability: 'Developability',
};

export default function ActiveCandidateCard() {
  const { candidates: live, isLive } = useEngineCandidates();
  const top = isLive && live && live.length > 0 ? live[0] : null;

  const name = top?.name ?? 'AX-7291';
  const stage = top?.stage ?? 'Lead Optimisation';
  const confidence = top?.confidence_label ?? 'High';
  const overallMean = top?.overall?.mean ?? 0.84;
  const overallCi = top?.overall
    ? `(${top.overall.ci_low.toFixed(2)}–${top.overall.ci_high.toFixed(2)})`
    : null;

  const properties: PropertyBar[] = top?.properties
    ? PROP_KEYS.map((k) => ({
        label: PROP_LABELS[k],
        value: Math.round(top.properties![k].mean * 100),
        ci: [top.properties![k].ci_low, top.properties![k].ci_high],
      }))
    : sampleProperties;

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
                {name}
              </h3>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: 'var(--cyan-soft)', color: 'var(--blue-deep)' }}
              >
                {stage}
              </span>
            </div>
            {isLive ? (
              <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--green)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
                Active candidate — live, engine v0
              </p>
            ) : (
              <p className="text-xs" style={{ color: 'var(--faint)' }}>Active candidate — sample data</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#E8F8F3' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--green)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              {overallMean.toFixed(2)} {overallCi ? `${overallCi} ` : ''}— {confidence} confidence
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
                  {prop.ci && (
                    <span style={{ color: 'var(--faint)' }}>
                      {' '}({Math.round(prop.ci[0] * 100)}–{Math.round(prop.ci[1] * 100)}%)
                    </span>
                  )}
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

      {/* Right: 3D molecule viewer */}
      <div className="flex-shrink-0">
        <MoleculeViewer3D width={260} height={260} className="rounded-xl overflow-hidden" />
      </div>
    </div>
  );
}
