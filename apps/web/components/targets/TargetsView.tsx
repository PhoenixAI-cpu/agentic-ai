'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TargetRow {
  gene: string;
  uniprot: string;
  disease: string;
  association: number;
  approvedDrugs: number;
  evidence: string;
}

const TARGETS: TargetRow[] = [
  {
    gene: 'EGFR',
    uniprot: 'P00533',
    disease: 'Non-small cell lung cancer',
    association: 0.92,
    approvedDrugs: 6,
    evidence:
      'Open Targets aggregates genetic association, somatic mutation, known drug, and pathway evidence. EGFR carries strong somatic-mutation and approved-drug signals in NSCLC, with multiple licensed tyrosine-kinase inhibitors reinforcing the score.',
  },
  {
    gene: 'KRAS G12C',
    uniprot: 'P01116',
    disease: 'Colorectal/lung cancer',
    association: 0.88,
    approvedDrugs: 2,
    evidence:
      'Driven by somatic-mutation frequency and recently approved covalent G12C inhibitors. Genetic evidence is robust; the approved-drug component is newer and still maturing across indications.',
  },
  {
    gene: 'TNF-alpha',
    uniprot: 'P01375',
    disease: 'Inflammatory disease',
    association: 0.95,
    approvedDrugs: 5,
    evidence:
      'Among the most validated targets in Open Targets — extensive approved-drug evidence (anti-TNF biologics), supportive genetic associations, and deep literature corroboration across inflammatory indications.',
  },
  {
    gene: 'TREM2',
    uniprot: 'Q9NZC2',
    disease: 'Neuroinflammation',
    association: 0.64,
    approvedDrugs: 0,
    evidence:
      'Association rests largely on genetic and expression evidence implicating TREM2 in microglial function and Alzheimer-type neuroinflammation. No approved drugs yet, so the score is weighted towards earlier-stage evidence streams.',
  },
  {
    gene: 'NLRP3',
    uniprot: 'Q96P20',
    disease: 'Neuroinflammation',
    association: 0.71,
    approvedDrugs: 0,
    evidence:
      'Inflammasome biology and pathway evidence support a moderate-to-strong association, alongside animal-model and literature signals. No approved drugs, with several inhibitors in clinical development.',
  },
];

function scoreColor(v: number): string {
  if (v >= 0.85) return 'var(--green)';
  if (v >= 0.7) return 'var(--blue)';
  return 'var(--amber)';
}

export default function TargetsView() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [engineConnected, setEngineConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    (async () => {
      try {
        const res = await fetch('/api/engine/pipelines/opentargets/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'EGFR' }),
          signal: controller.signal,
        });
        if (!cancelled && res.ok) setEngineConnected(true);
      } catch {
        // Silent fallback — sample data stands.
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)' }}
          >
            Targets &amp; Pathways
          </h1>
          <p className="text-sm" style={{ color: 'var(--slate)' }}>
            Therapeutic targets with evidence-backed association scores.{' '}
            <span style={{ color: 'var(--faint)' }}>
              (Sample data — live Open Targets integration available via engine)
            </span>
          </p>
        </div>
        {engineConnected && (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--green)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
            Engine connected
          </span>
        )}
      </div>

      <div
        className="rounded-xl border border-[var(--line)] overflow-hidden"
        style={{ background: 'var(--panel)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]" style={{ background: 'var(--bg)' }}>
              {['Target', 'Disease association', 'Association score', 'Approved drugs'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((t) => {
              const isOpen = expanded === t.uniprot;
              return (
                <>
                  <tr
                    key={t.uniprot}
                    className="border-b border-[var(--line)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : t.uniprot)}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        {isOpen ? (
                          <ChevronDown size={14} style={{ color: 'var(--faint)' }} />
                        ) : (
                          <ChevronRight size={14} style={{ color: 'var(--faint)' }} />
                        )}
                        <span className="font-medium" style={{ color: 'var(--ink)' }}>
                          {t.gene}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--faint)', fontFamily: 'var(--font-jetbrains-mono)' }}
                        >
                          {t.uniprot}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--slate)' }}>
                      {t.disease}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full" style={{ background: 'var(--bg)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${t.association * 100}%`, background: scoreColor(t.association) }}
                          />
                        </div>
                        <span
                          className="font-semibold"
                          style={{ color: scoreColor(t.association), fontFamily: 'var(--font-jetbrains-mono)' }}
                        >
                          {t.association.toFixed(2)}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px]"
                          style={{ background: 'var(--cyan-soft)', color: 'var(--blue-deep)' }}
                        >
                          Open Targets
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      {t.approvedDrugs}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${t.uniprot}-evidence`} style={{ background: 'var(--bg)' }}>
                      <td colSpan={4} className="px-4 py-3">
                        <p
                          className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                          style={{ color: 'var(--faint)', fontFamily: 'var(--font-jetbrains-mono)' }}
                        >
                          Evidence basis
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--slate)' }}>
                          {t.evidence}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
