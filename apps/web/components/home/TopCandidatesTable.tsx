import { ConfidenceLevel } from '@/lib/types';

interface Candidate {
  name: string;
  score: number;
  stage: string;
  confidence: ConfidenceLevel;
}

const candidates: Candidate[] = [
  { name: 'AX-7291', score: 0.84, stage: 'Lead Optimisation', confidence: 'High' },
  { name: 'AX-6104', score: 0.79, stage: 'Hit-to-Lead', confidence: 'High' },
  { name: 'AX-5892', score: 0.71, stage: 'Hit Identification', confidence: 'Medium' },
  { name: 'BX-3341', score: 0.68, stage: 'Hit Identification', confidence: 'Medium' },
  { name: 'CX-1205', score: 0.61, stage: 'Screening', confidence: 'Low' },
];

const confidenceStyles: Record<ConfidenceLevel, { bg: string; text: string }> = {
  High: { bg: '#E8F8F3', text: '#16A375' },
  Medium: { bg: '#FEF8EC', text: '#D9962B' },
  Low: { bg: '#FEF2F2', text: '#E0524D' },
};

const scoreColor = (score: number) => {
  if (score >= 0.8) return 'var(--green)';
  if (score >= 0.7) return 'var(--blue)';
  if (score >= 0.6) return 'var(--amber)';
  return 'var(--red)';
};

export default function TopCandidatesTable() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          Top Candidates
        </h2>
        <span className="text-xs" style={{ color: 'var(--faint)' }}>Sample data</span>
      </div>
      <div
        className="rounded-xl border border-[var(--line)] overflow-hidden"
        style={{ background: 'var(--panel)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]" style={{ background: 'var(--bg)' }}>
              <th
                className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                Candidate
              </th>
              <th
                className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                Overall Score
              </th>
              <th
                className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                Stage
              </th>
              <th
                className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => {
              const confStyle = confidenceStyles[c.confidence];
              return (
                <tr
                  key={c.name}
                  className={`border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg)] transition-colors cursor-pointer`}
                >
                  <td className="px-4 py-3">
                    <span
                      className="font-medium"
                      style={{ color: 'var(--ink)', fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      {c.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: scoreColor(c.score), fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        {c.score.toFixed(2)}
                      </span>
                      <div className="h-1.5 w-16 rounded-full" style={{ background: 'var(--bg)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${c.score * 100}%`,
                            background: scoreColor(c.score),
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: 'var(--slate)' }}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: confStyle.bg, color: confStyle.text }}
                    >
                      {c.confidence}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
