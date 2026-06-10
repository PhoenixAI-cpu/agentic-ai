'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { LedgerEvent } from '@/lib/types';
import { getEvents } from '@/lib/ledger';

const FILTERS = ['All', 'Ana', 'Engine', 'User'] as const;
type Filter = (typeof FILTERS)[number];

interface DisplayEvent extends LedgerEvent {
  sample?: boolean;
}

const now = Date.now();
const hours = (n: number) => new Date(now - n * 3_600_000).toISOString();

const SAMPLE_EVENTS: DisplayEvent[] = [
  {
    id: 'sample-1',
    occurredAt: hours(1),
    actor: 'Engine v0',
    action: 'Scored candidate set',
    subject: 'Sample candidates',
    detail: { count: 6 },
    confidence: 'Bayesian 95% CI',
    reasoning: 'Rule-based Bayesian scoring across efficacy, safety, ADMET and developability.',
    sample: true,
  },
  {
    id: 'sample-2',
    occurredAt: hours(3),
    actor: 'Ana',
    action: 'Summarised Phase II failures',
    subject: 'Oncology, 2024–2026',
    reasoning: 'Synthesised trial registry data with literature on failure modes.',
    confidence: 'Medium',
    sample: true,
  },
  {
    id: 'sample-3',
    occurredAt: hours(7),
    actor: 'Engine v0',
    action: 'Literature Review agent completed run',
    subject: 'KRAS G12C resistance mechanisms',
    detail: { papersReviewed: 142, durationMinutes: 18 },
    confidence: 'High',
    sample: true,
  },
  {
    id: 'sample-4',
    occurredAt: hours(26),
    actor: 'User',
    action: 'Uploaded dataset',
    subject: 'compound_library_v3.sdf',
    detail: { sizeBytes: 8421376 },
    sample: true,
  },
  {
    id: 'sample-5',
    occurredAt: hours(30),
    actor: 'Engine v0',
    action: 'Molecular Design agent started',
    subject: 'Selectivity optimisation, KRAS series',
    reasoning: 'Triggered by user request to improve selectivity over wild-type.',
    sample: true,
  },
  {
    id: 'sample-6',
    occurredAt: hours(49),
    actor: 'Ana',
    action: 'Generated target hypothesis',
    subject: 'Neuroinflammation pathways',
    reasoning: 'Cross-referenced publications and protein database evidence.',
    confidence: 'Medium',
    sample: true,
  },
];

function actorStyle(actor: string): { bg: string; text: string } {
  if (actor.startsWith('Ana')) return { bg: 'var(--cyan-soft)', text: 'var(--cyan)' };
  if (actor.startsWith('Engine')) return { bg: '#E8F0FD', text: 'var(--blue)' };
  return { bg: 'var(--bg)', text: 'var(--slate)' };
}

function matchesFilter(event: DisplayEvent, filter: Filter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Engine') return event.actor.startsWith('Engine');
  return event.actor.startsWith(filter);
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d
      .toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      .replace(',', '');
  } catch {
    return iso;
  }
}

export default function LedgerView() {
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    void getEvents().then(setEvents);
  }, []);

  const merged: DisplayEvent[] = [...events, ...SAMPLE_EVENTS];
  const visible = merged.filter((e) => matchesFilter(e, filter));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(merged, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antaria-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)' }}
        >
          Evidence Ledger
        </h1>
        <button
          type="button"
          onClick={exportJson}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--line)] transition-colors hover:border-[var(--cyan)]"
          style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)', background: 'var(--panel)' }}
        >
          <Download size={13} />
          Export ledger (JSON)
        </button>
      </div>
      <p
        className="text-sm mb-5"
        style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)' }}
      >
        An append-only record of every analysis, score, and action — what was run, when, on
        what data, and why.
      </p>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: filter === f ? 'var(--cyan)' : 'var(--line)',
              background: filter === f ? 'var(--cyan-soft)' : 'var(--panel)',
              color: filter === f ? 'var(--navy)' : 'var(--slate)',
              fontFamily: 'var(--font-inter)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {events.length === 0 && (
        <p
          className="text-xs mb-4"
          style={{ color: 'var(--faint)', fontFamily: 'var(--font-inter)' }}
        >
          No events recorded yet. Actions taken by you, Ana, and the engine will appear here.
          Sample entries are shown below.
        </p>
      )}

      {/* Timeline */}
      <ul className="space-y-2">
        {visible.map((event) => {
          const style = actorStyle(event.actor);
          const isOpen = expanded.has(event.id);
          const hasDetail = Boolean(event.reasoning || event.confidence || event.detail);
          return (
            <li
              key={event.id}
              className="rounded-xl border border-[var(--line)] overflow-hidden"
              style={{ background: 'var(--panel)' }}
            >
              <div
                role={hasDetail ? 'button' : undefined}
                tabIndex={hasDetail ? 0 : undefined}
                onClick={() => hasDetail && toggle(event.id)}
                onKeyDown={(e) => {
                  if (hasDetail && (e.key === 'Enter' || e.key === ' ')) toggle(event.id);
                }}
                className={`flex items-center gap-3 px-4 py-3 ${hasDetail ? 'cursor-pointer' : ''}`}
              >
                <span
                  className="text-[11px] flex-shrink-0 w-[150px]"
                  style={{ color: 'var(--faint)', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {formatTimestamp(event.occurredAt)}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                  style={{
                    background: style.bg,
                    color: style.text,
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}
                >
                  {event.actor}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--ink)', fontFamily: 'var(--font-inter)' }}
                  >
                    {event.action}
                  </span>
                  {event.subject && (
                    <span
                      className="text-xs ml-2 truncate"
                      style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)' }}
                    >
                      {event.subject}
                    </span>
                  )}
                </span>
                {event.sample && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                    style={{
                      background: 'var(--bg)',
                      color: 'var(--faint)',
                      fontFamily: 'var(--font-jetbrains-mono)',
                    }}
                  >
                    Sample
                  </span>
                )}
                {hasDetail &&
                  (isOpen ? (
                    <ChevronDown size={14} style={{ color: 'var(--faint)' }} />
                  ) : (
                    <ChevronRight size={14} style={{ color: 'var(--faint)' }} />
                  ))}
              </div>

              {isOpen && hasDetail && (
                <div
                  className="px-4 py-3 border-t border-[var(--line)] space-y-2"
                  style={{ background: 'var(--cyan-soft)' }}
                >
                  {event.reasoning && (
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                        style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        Reasoning
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--ink)', fontFamily: 'var(--font-inter)' }}
                      >
                        {event.reasoning}
                      </p>
                    </div>
                  )}
                  {event.confidence && (
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                        style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        Confidence
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--ink)', fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        {event.confidence}
                      </p>
                    </div>
                  )}
                  {event.detail && (
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                        style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                      >
                        Detail
                      </p>
                      <pre
                        className="text-[11px] rounded-lg p-2 overflow-x-auto"
                        style={{
                          color: 'var(--ink)',
                          background: 'var(--panel)',
                          fontFamily: 'var(--font-jetbrains-mono)',
                        }}
                      >
                        {JSON.stringify(event.detail, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p
          className="text-sm text-center py-8"
          style={{ color: 'var(--faint)', fontFamily: 'var(--font-inter)' }}
        >
          No events recorded yet. Actions taken by you, Ana, and the engine will appear here.
        </p>
      )}
    </div>
  );
}
