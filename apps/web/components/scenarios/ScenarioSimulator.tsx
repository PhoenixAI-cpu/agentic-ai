'use client';

import { useMemo, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { Plus, X } from 'lucide-react';
import { useEngineCandidates, type EngineCandidate } from '@/lib/useEngine';
import { logEvent } from '@/lib/ledger';
import type { ConfidenceLevel } from '@/lib/types';

// ---- Local model -----------------------------------------------------------

interface PropScore {
  mean: number;
  ciLow: number;
  ciHigh: number;
}

interface ScenarioCandidate {
  id: string;
  name: string;
  confidence: ConfidenceLevel;
  efficacy: PropScore;
  safety: PropScore;
  admet: PropScore;
  developability: PropScore;
  overall: PropScore;
}

const AXES = [
  { key: 'efficacy', label: 'Efficacy' },
  { key: 'safety', label: 'Safety' },
  { key: 'admet', label: 'ADMET' },
  { key: 'developability', label: 'Developability' },
] as const;

const ROW_KEYS = [...AXES.map((a) => a.key), 'overall'] as const;
const ROW_LABELS: Record<string, string> = {
  efficacy: 'Efficacy',
  safety: 'Safety',
  admet: 'ADMET',
  developability: 'Developability',
  overall: 'Overall',
};

// Distinct strokes per the brief: cyan, blue, amber (no purple).
const SERIES_HEX = ['#1FB6D6', '#1E6BE6', '#D9962B'];

// ---- Sample fallback -------------------------------------------------------

const s = (mean: number, ciLow: number, ciHigh: number): PropScore => ({ mean, ciLow, ciHigh });

const SAMPLE_CANDIDATES: ScenarioCandidate[] = [
  {
    id: 'ax-7291',
    name: 'AX-7291',
    confidence: 'High',
    efficacy: s(0.61, 0.52, 0.7),
    safety: s(0.49, 0.4, 0.58),
    admet: s(0.66, 0.58, 0.74),
    developability: s(0.58, 0.49, 0.67),
    overall: s(0.59, 0.51, 0.67),
  },
  {
    id: 'ax-6104',
    name: 'AX-6104',
    confidence: 'High',
    efficacy: s(0.55, 0.46, 0.64),
    safety: s(0.58, 0.5, 0.66),
    admet: s(0.6, 0.51, 0.69),
    developability: s(0.63, 0.55, 0.71),
    overall: s(0.59, 0.5, 0.68),
  },
  {
    id: 'ax-5892',
    name: 'AX-5892',
    confidence: 'Medium',
    efficacy: s(0.48, 0.37, 0.59),
    safety: s(0.52, 0.41, 0.63),
    admet: s(0.57, 0.46, 0.68),
    developability: s(0.5, 0.39, 0.61),
    overall: s(0.52, 0.41, 0.63),
  },
  {
    id: 'bx-3341',
    name: 'BX-3341',
    confidence: 'Medium',
    efficacy: s(0.44, 0.32, 0.56),
    safety: s(0.61, 0.5, 0.72),
    admet: s(0.46, 0.34, 0.58),
    developability: s(0.55, 0.43, 0.67),
    overall: s(0.5, 0.39, 0.61),
  },
];

function fromEngine(c: EngineCandidate): ScenarioCandidate | null {
  if (!c.overall || !c.properties) return null;
  const p = (x: { mean: number; ci_low: number; ci_high: number }): PropScore => ({
    mean: x.mean,
    ciLow: x.ci_low,
    ciHigh: x.ci_high,
  });
  return {
    id: c.id,
    name: c.name,
    confidence: (c.confidence_label ?? 'Low') as ConfidenceLevel,
    efficacy: p(c.properties.efficacy),
    safety: p(c.properties.safety),
    admet: p(c.properties.admet),
    developability: p(c.properties.developability),
    overall: p(c.overall),
  };
}

// ---- Helpers ---------------------------------------------------------------

const pct = (v: number) => `${Math.round(v * 100)}%`;
const fmt = (v: number) => v.toFixed(2);

function valueTint(v: number): string {
  // Green for strong, amber for weak — light tints only.
  if (v >= 0.6) return 'rgba(22, 163, 117, 0.12)';
  if (v >= 0.5) return 'rgba(217, 150, 43, 0.1)';
  return 'rgba(224, 82, 77, 0.1)';
}

function ciOverlap(a: PropScore, b: PropScore): boolean {
  return a.ciLow <= b.ciHigh && b.ciLow <= a.ciHigh;
}

function buildTradeOff(selected: ScenarioCandidate[]): string {
  if (selected.length < 2) return '';
  const sentences: string[] = [];

  for (const { key, label } of AXES) {
    const ranked = [...selected].sort(
      (a, b) => (b[key] as PropScore).mean - (a[key] as PropScore).mean
    );
    const top = ranked[0];
    const second = ranked[1];
    const topScore = (top[key] as PropScore).mean;
    const secondScore = (second[key] as PropScore).mean;
    if (topScore - secondScore >= 0.04) {
      sentences.push(
        `${top.name} leads on ${label.toLowerCase()} (${fmt(topScore)} vs ${fmt(secondScore)})`
      );
    }
  }

  // Honesty about overlapping CIs.
  let anyDecisive = false;
  for (const { key } of AXES) {
    const ranked = [...selected].sort(
      (a, b) => (b[key] as PropScore).mean - (a[key] as PropScore).mean
    );
    if (!ciOverlap(ranked[0][key] as PropScore, ranked[1][key] as PropScore)) {
      anyDecisive = true;
    }
  }

  const lead =
    sentences.length > 0
      ? sentences.slice(0, 2).join(' whilst ') + '.'
      : 'No candidate establishes a clear advantage on any single axis.';

  const caveat = anyDecisive
    ? 'At least one axis separates beyond the 95% credibility interval; treat that difference as meaningful.'
    : 'Confidence intervals overlap on all axes — the difference is not decisive at 95% credibility.';

  return `${lead} ${caveat}`;
}

// ---- Component -------------------------------------------------------------

export default function ScenarioSimulator() {
  const { candidates: live, isLive } = useEngineCandidates();

  const pool: ScenarioCandidate[] = useMemo(() => {
    if (isLive && live) {
      const mapped = live.map(fromEngine).filter((c): c is ScenarioCandidate => c !== null);
      if (mapped.length >= 2) return mapped;
    }
    return SAMPLE_CANDIDATES;
  }, [isLive, live]);

  const [slots, setSlots] = useState<string[]>(['__0', '__1']);

  // Reconcile slots against the resolved pool (engine arrives after first render).
  const reconciled = useMemo(() => {
    return slots.map((id, i) =>
      pool.some((c) => c.id === id) ? id : pool[i]?.id ?? pool[0]?.id ?? ''
    );
  }, [slots, pool]);

  const selected = useMemo(
    () =>
      reconciled
        .map((id) => pool.find((c) => c.id === id))
        .filter((c): c is ScenarioCandidate => c !== undefined),
    [reconciled, pool]
  );

  // De-duplicate for the comparison (a candidate selected twice counts once).
  const uniqueSelected = useMemo(() => {
    const seen = new Set<string>();
    return selected.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [selected]);

  const setSlot = (index: number, id: string) => {
    setSlots((prev) => prev.map((v, i) => (i === index ? id : reconciled[i] ?? v)));
  };

  const addSlot = () => {
    if (slots.length >= 3) return;
    const used = new Set(reconciled);
    const next = pool.find((c) => !used.has(c.id)) ?? pool[0];
    setSlots(() => [...reconciled, next?.id ?? '']);
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 2) return;
    setSlots(() => reconciled.filter((_, i) => i !== index));
  };

  const runComparison = () => {
    if (uniqueSelected.length < 2) return;
    void logEvent({
      actor: 'User',
      action: 'Ran scenario comparison',
      subject: uniqueSelected.map((c) => c.name).join(', '),
      confidence: 'Bayesian 95% CI',
    });
  };

  // Radar data: one entry per axis, one numeric column per candidate.
  const radarData = useMemo(
    () =>
      AXES.map(({ key, label }) => {
        const row: Record<string, number | string> = { axis: label };
        uniqueSelected.forEach((c) => {
          row[c.name] = Math.round((c[key] as PropScore).mean * 100);
        });
        return row;
      }),
    [uniqueSelected]
  );

  const tradeOff = useMemo(() => buildTradeOff(uniqueSelected), [uniqueSelected]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)' }}
          >
            Scenario Simulator
          </h1>
          <p className="text-sm" style={{ color: 'var(--slate)' }}>
            Compare candidates side by side with calibrated uncertainty.
          </p>
        </div>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--green)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
            Live — engine v0
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--faint)' }}>
            (Sample data)
          </span>
        )}
      </div>

      {/* Candidate pickers */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        {reconciled.map((id, index) => (
          <div key={index} className="flex flex-col gap-1">
            <label
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              Candidate {index + 1}
            </label>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: SERIES_HEX[index % SERIES_HEX.length] }}
              />
              <select
                value={id}
                onChange={(e) => setSlot(index, e.target.value)}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm bg-[var(--panel)]"
                style={{ color: 'var(--ink)', minWidth: '180px' }}
              >
                {pool.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {slots.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeSlot(index)}
                  aria-label={`Remove candidate ${index + 1}`}
                  className="p-1.5 rounded-md hover:bg-[var(--bg)] transition-colors"
                  style={{ color: 'var(--faint)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        {slots.length < 3 && (
          <button
            type="button"
            onClick={addSlot}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--line)] text-sm transition-colors hover:border-[var(--cyan)]"
            style={{ color: 'var(--slate)', background: 'var(--panel)' }}
          >
            <Plus size={14} />
            Add candidate
          </button>
        )}

        <button
          type="button"
          onClick={runComparison}
          disabled={uniqueSelected.length < 2}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: 'var(--blue)' }}
        >
          Run comparison
        </button>
      </div>

      {uniqueSelected.length < 2 ? (
        <div
          className="rounded-xl border border-[var(--line)] px-6 py-12 text-center"
          style={{ background: 'var(--panel)' }}
        >
          <p className="text-sm" style={{ color: 'var(--slate)' }}>
            Select at least two distinct candidates to compare.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Radar chart */}
          <div
            className="rounded-xl border border-[var(--line)] p-5"
            style={{ background: 'var(--panel)' }}
          >
            <h2
              className="text-base font-semibold mb-3"
              style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
            >
              Property profile
            </h2>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="var(--line)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--slate)', fontSize: 12 }} />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fill: 'var(--faint)', fontSize: 10 }}
                    axisLine={false}
                  />
                  {uniqueSelected.map((c, i) => (
                    <Radar
                      key={c.id}
                      name={c.name}
                      dataKey={c.name}
                      stroke={SERIES_HEX[i % SERIES_HEX.length]}
                      fill={SERIES_HEX[i % SERIES_HEX.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend below */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              {uniqueSelected.map((c, i) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ background: SERIES_HEX[i % SERIES_HEX.length] }}
                  />
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Side-by-side property table */}
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
                    Property
                  </th>
                  {uniqueSelected.map((c, i) => (
                    <th
                      key={c.id}
                      className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: SERIES_HEX[i % SERIES_HEX.length] }}
                        />
                        {c.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROW_KEYS.map((rowKey) => {
                  const values = uniqueSelected.map((c) => (c[rowKey] as PropScore).mean);
                  const best = Math.max(...values);
                  return (
                    <tr key={rowKey} className="border-b border-[var(--line)] last:border-0">
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--ink)' }}>
                        {ROW_LABELS[rowKey]}
                      </td>
                      {uniqueSelected.map((c) => {
                        const ps = c[rowKey] as PropScore;
                        const isBest = ps.mean === best;
                        return (
                          <td
                            key={c.id}
                            className="px-4 py-3"
                            style={{
                              background: isBest ? 'var(--cyan-soft)' : valueTint(ps.mean),
                            }}
                          >
                            <span
                              className="font-semibold"
                              style={{
                                color: 'var(--ink)',
                                fontFamily: 'var(--font-jetbrains-mono)',
                              }}
                            >
                              {pct(ps.mean)}
                            </span>
                            <span
                              className="ml-1.5 text-xs"
                              style={{
                                color: 'var(--faint)',
                                fontFamily: 'var(--font-jetbrains-mono)',
                              }}
                            >
                              CI {fmt(ps.ciLow)}–{fmt(ps.ciHigh)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Trade-off summary card */}
          <div
            className="rounded-xl border p-5"
            style={{ background: 'var(--cyan-soft)', borderColor: 'var(--cyan)' }}
          >
            <h2
              className="text-sm font-semibold mb-1.5"
              style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
            >
              Trade-off summary
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
              {tradeOff}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
