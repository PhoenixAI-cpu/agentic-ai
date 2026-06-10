'use client';

import { useState, useEffect, useCallback } from 'react';
import { logEvent } from '@/lib/ledger';
import type { ReportData } from './ReportPDFExport';

// Dynamic import to avoid SSR issues with @react-pdf/renderer

// ---- Types -----------------------------------------------------------------

interface ReportListItem {
  id: string;
  projectName: string;
  indication: string;
  generatedAt: string;
  stage: string;
  isSample?: boolean;
  data?: ReportData;
}

type TabKey = 'summary' | 'candidates' | 'safety' | 'trials' | 'recommendations';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'summary', label: 'Executive Summary' },
  { key: 'candidates', label: 'Candidates' },
  { key: 'safety', label: 'Safety Flags' },
  { key: 'trials', label: 'Trial Landscape' },
  { key: 'recommendations', label: 'Recommendations' },
];

// ---- Seed data -------------------------------------------------------------

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();

const SEED_REPORTS: ReportListItem[] = [
  {
    id: 'sample-apollo',
    projectName: 'Project APOLLO',
    indication: 'EGFR-driven non-small cell lung cancer',
    stage: 'Lead Optimisation',
    generatedAt: daysAgo(0),
    isSample: true,
  },
  {
    id: 'sample-meridian',
    projectName: 'Project MERIDIAN',
    indication: 'KRAS oncology',
    stage: 'Hit-to-Lead',
    generatedAt: daysAgo(3),
    isSample: true,
  },
  {
    id: 'sample-cardinal',
    projectName: 'Project CARDINAL',
    indication: 'CNS neuroinflammation',
    stage: 'Hit Identification',
    generatedAt: daysAgo(7),
    isSample: true,
  },
];

// ---- Helpers ---------------------------------------------------------------

function scoreColor(mean: number): string {
  if (mean >= 0.7) return 'var(--green)';
  if (mean >= 0.55) return 'var(--blue)';
  if (mean >= 0.4) return 'var(--amber)';
  return 'var(--red)';
}

function confStyle(label: string): { bg: string; text: string } {
  if (label === 'High') return { bg: '#E8F8F3', text: '#16A375' };
  if (label === 'Medium') return { bg: '#FEF8EC', text: '#D9962B' };
  return { bg: '#FEF2F2', text: '#E0524D' };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ---- Modal -----------------------------------------------------------------

interface GenerateModalProps {
  onClose: () => void;
  onGenerated: (report: ReportListItem) => void;
}

const PROJECTS = ['APOLLO', 'MERIDIAN', 'CARDINAL'];
const STAGES = ['Hit Identification', 'Hit-to-Lead', 'Lead Optimisation', 'Candidate Selection'];
const PROJECT_INDICATIONS: Record<string, string> = {
  APOLLO: 'EGFR-driven non-small cell lung cancer',
  MERIDIAN: 'KRAS oncology',
  CARDINAL: 'CNS neuroinflammation',
};
const PROJECT_CANDIDATES: Record<string, string[]> = {
  APOLLO: ['AX-7291', 'AX-6104', 'AX-5892'],
  MERIDIAN: ['BX-3341', 'AX-6104'],
  CARDINAL: ['CX-1205', 'AX-5892'],
};

function GenerateModal({ onClose, onGenerated }: GenerateModalProps) {
  const [project, setProject] = useState('APOLLO');
  const [indication, setIndication] = useState(PROJECT_INDICATIONS['APOLLO']);
  const [stage, setStage] = useState('Lead Optimisation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProjectChange = (p: string) => {
    setProject(p);
    setIndication(PROJECT_INDICATIONS[p] ?? '');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/engine/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: `Project ${project}`,
          candidates: PROJECT_CANDIDATES[project] ?? ['AX-7291'],
          indication,
          stage,
          include_sections: [
            'executive_summary', 'candidate_ranking', 'safety_flags',
            'trial_landscape', 'recommendations',
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 503 || body?.error === 'Engine unreachable') {
          setError(
            'The engine is not running. Start it with `uvicorn app.main:app --port 8000` to generate live reports.'
          );
        } else {
          setError(`Engine returned ${res.status}: ${body?.detail ?? 'unknown error'}`);
        }
        setLoading(false);
        return;
      }

      const data: ReportData = await res.json();

      await logEvent({
        actor: 'Engine v0',
        action: 'Generated Decision Intelligence Report',
        subject: `Project ${project}`,
        confidence: 'Bayesian 95% CI',
      });

      const item: ReportListItem = {
        id: `live-${Date.now()}`,
        projectName: data.project_name,
        indication: data.indication,
        stage: data.stage,
        generatedAt: data.sections.metadata?.generated_at ?? new Date().toISOString(),
        isSample: false,
        data,
      };

      onGenerated(item);
    } catch (err) {
      setError(
        'The engine is not running. Start it with `uvicorn app.main:app --port 8000` to generate live reports.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(10,27,61,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--panel)', borderRadius: 12,
          border: '1px solid var(--line)', padding: 28,
          width: 440, maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(10,27,61,0.12)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: 18, fontWeight: 600 }}>
            Generate Report
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', fontSize: 20 }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Project */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 6 }}>
            Project
          </span>
          <select
            value={project}
            onChange={(e) => handleProjectChange(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px',
              border: '1px solid var(--line)', borderRadius: 8,
              background: 'var(--bg)', color: 'var(--ink)', fontSize: 14,
            }}
          >
            {PROJECTS.map((p) => (
              <option key={p} value={p}>{`Project ${p}`}</option>
            ))}
          </select>
        </label>

        {/* Indication */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 6 }}>
            Indication
          </span>
          <input
            type="text"
            value={indication}
            onChange={(e) => setIndication(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px',
              border: '1px solid var(--line)', borderRadius: 8,
              background: 'var(--bg)', color: 'var(--ink)', fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </label>

        {/* Stage */}
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 6 }}>
            Stage
          </span>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px',
              border: '1px solid var(--line)', borderRadius: 8,
              background: 'var(--bg)', color: 'var(--ink)', fontSize: 14,
            }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        {error && (
          <div
            style={{
              marginBottom: 16, padding: '10px 14px',
              border: '1px solid var(--amber)', borderRadius: 8,
              background: '#FEF8EC', color: '#92600A', fontSize: 13,
              fontFamily: 'var(--font-jetbrains-mono)',
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div
            style={{
              marginBottom: 16, padding: '10px 14px',
              border: '1px solid var(--line)', borderRadius: 8,
              background: 'var(--bg)', color: 'var(--slate)', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--cyan)', display: 'inline-block',
                animation: 'antaria-pulse 1.2s ease-in-out infinite',
              }}
            />
            Ana is generating your report...
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: '100%', padding: '10px 0',
            background: loading ? 'var(--faint)' : 'var(--navy)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-space-grotesk)',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </div>
  );
}

// ---- Score bar -------------------------------------------------------------

function MiniBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = scoreColor(value);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}>
          {label}
        </span>
        <span style={{ fontSize: 10, color, fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600 }}>
          {value.toFixed(2)}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// ---- Tabs content ----------------------------------------------------------

function SummaryTab({ report }: { report: ReportData }) {
  const ranking = report.sections.candidate_ranking ?? [];
  return (
    <div>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink)', marginBottom: 24 }}>
        {report.sections.executive_summary ?? 'No summary available.'}
      </p>
      {ranking.length > 0 && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
                {['Candidate', 'Overall Score', 'Confidence', 'Recommendation'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 14px',
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--slate)',
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((c, i) => {
                const cs = c.confidence_label ? confStyle(c.confidence_label) : { bg: '#f5f5f5', text: '#666' };
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--line)', background: i % 2 ? 'var(--bg)' : 'var(--panel)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                      {c.name}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-jetbrains-mono)' }}>
                      {c.overall_score
                        ? <span style={{ color: scoreColor(c.overall_score.mean), fontWeight: 600 }}>
                            {c.overall_score.mean.toFixed(2)}
                            <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 400 }}>
                              {' '}({c.overall_score.ci_low.toFixed(2)}–{c.overall_score.ci_high.toFixed(2)})
                            </span>
                          </span>
                        : <span style={{ color: 'var(--faint)' }}>N/A</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.confidence_label && (
                        <span style={{
                          background: cs.bg, color: cs.text,
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        }}>
                          {c.confidence_label}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--slate)' }}>
                      {i === 0 ? 'Lead candidate — advance to next synthesis round' :
                       i === ranking.length - 1 ? 'Consider deprioritising' : 'Continue monitoring'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CandidatesTab({ report }: { report: ReportData }) {
  const ranking = report.sections.candidate_ranking ?? [];
  if (ranking.length === 0) return <p style={{ color: 'var(--slate)' }}>No candidate data available.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ranking.map((c, i) => {
        const cs = c.confidence_label ? confStyle(c.confidence_label) : { bg: '#f5f5f5', text: '#666' };
        const props = c.properties ?? {};
        return (
          <div key={c.id} style={{
            border: '1px solid var(--line)', borderRadius: 10,
            padding: 16, background: 'var(--panel)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--bg)', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--slate)',
              }}>
                {i + 1}
              </div>
              <span style={{
                fontFamily: 'var(--font-space-grotesk)', fontWeight: 700,
                fontSize: 16, color: 'var(--navy)',
              }}>
                {c.name}
              </span>
              {c.confidence_label && (
                <span style={{
                  background: cs.bg, color: cs.text,
                  padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                }}>
                  {c.confidence_label}
                </span>
              )}
              {c.overall_score && (
                <span style={{
                  marginLeft: 'auto', fontFamily: 'var(--font-jetbrains-mono)',
                  fontSize: 18, fontWeight: 700,
                  color: scoreColor(c.overall_score.mean),
                }}>
                  {c.overall_score.mean.toFixed(2)}
                  <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 400 }}>
                    {' '}95% CI {c.overall_score.ci_low.toFixed(2)}–{c.overall_score.ci_high.toFixed(2)}
                  </span>
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: 10 }}>
              {Object.entries(props).map(([k, v]) => (
                <MiniBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v.mean} />
              ))}
            </div>
            {c.rationale && (
              <p style={{ fontSize: 12, color: 'var(--slate)', margin: 0, lineHeight: 1.5, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                {c.rationale}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SafetyTab({ report }: { report: ReportData }) {
  const flags = report.sections.safety_flags ?? {};
  const entries = Object.entries(flags);
  if (entries.length === 0) return <p style={{ color: 'var(--slate)' }}>No safety flag data available.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {entries.map(([name, candidateFlags]) => (
        <div key={name}>
          <h3 style={{
            fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)',
            fontSize: 14, fontWeight: 600, marginBottom: 10,
          }}>
            {name}
          </h3>
          {candidateFlags.length === 0 ? (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              border: '1px solid var(--green)', background: '#E8F8F3',
              color: '#16A375', fontSize: 13,
            }}>
              No flags raised — property profile within recommended bounds.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {candidateFlags.map((flag, i) => (
                <div key={i} style={{
                  borderLeft: `3px solid ${flag.severity === 'high' ? 'var(--red)' : 'var(--amber)'}`,
                  borderRadius: '0 8px 8px 0',
                  background: flag.severity === 'high' ? '#FEF2F2' : '#FEF8EC',
                  padding: '10px 14px',
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      color: flag.severity === 'high' ? 'var(--red)' : 'var(--amber)',
                      fontFamily: 'var(--font-jetbrains-mono)',
                    }}>
                      {flag.severity}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>
                      {flag.property}
                    </span>
                    {flag.value !== undefined && (
                      <span style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                        value: {flag.value} / threshold: {flag.threshold}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.5 }}>
                    {flag.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TrialsTab({ report }: { report: ReportData }) {
  return (
    <div style={{
      border: '1px solid var(--amber)', borderRadius: 10,
      padding: 20, background: '#FEF8EC',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{
          fontSize: 18, lineHeight: 1,
          color: 'var(--amber)', fontWeight: 700,
        }}>!</span>
        <div>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#92600A', fontSize: 14 }}>
            Phase 9 will connect live ClinicalTrials.gov data.
          </p>
          <p style={{ margin: 0, color: '#92600A', fontSize: 13, lineHeight: 1.6 }}>
            {report.sections.trial_landscape}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendationsTab({ report }: { report: ReportData }) {
  const recs = report.sections.recommendations ?? [];
  if (recs.length === 0) return <p style={{ color: 'var(--slate)' }}>No recommendations available.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {recs.map((rec, i) => (
        <div key={i} style={{
          borderLeft: '3px solid var(--navy)',
          borderRadius: '0 8px 8px 0',
          background: 'var(--bg)', padding: '12px 16px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12,
            fontWeight: 700, color: 'var(--navy)', minWidth: 20,
          }}>
            {i + 1}.
          </span>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>
            {rec}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---- Report viewer ---------------------------------------------------------

function ReportViewer({ report }: { report: ReportData }) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [pdfModule, setPdfModule] = useState<{ generateReportPDF: (r: ReportData) => Promise<void> } | null>(null);

  useEffect(() => {
    import('./ReportPDFExport').then((m) => setPdfModule(m)).catch(() => null);
  }, []);

  const meta = report.sections.metadata;

  const handleExportPDF = async () => {
    if (pdfModule) {
      await pdfModule.generateReportPDF(report);
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antaria-report-${report.project_name.toLowerCase().replace(/\s+/g, '-')}-${(meta?.generated_at ?? new Date().toISOString()).slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Report header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <h1 style={{
            fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)',
            fontSize: 24, fontWeight: 700, margin: 0,
          }}>
            {report.project_name}
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
              background: '#EFF6FF', color: 'var(--blue)',
              fontFamily: 'var(--font-jetbrains-mono)',
            }}>
              {report.stage}
            </span>
            {meta && (
              <span style={{
                padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                background: 'var(--bg)', color: 'var(--slate)',
                fontFamily: 'var(--font-jetbrains-mono)',
                border: '1px solid var(--line)',
              }}>
                Engine {meta.engine_version}
              </span>
            )}
          </div>
        </div>
        <p style={{ margin: '0 0 4px', color: 'var(--slate)', fontSize: 13 }}>
          {report.indication}
        </p>
        {meta && (
          <p style={{ margin: '0 0 14px', color: 'var(--faint)', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)' }}>
            Generated {formatDate(meta.generated_at)}
          </p>
        )}
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? 'var(--navy)' : 'var(--slate)',
                borderBottom: activeTab === tab.key ? '2px solid var(--blue)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {activeTab === 'summary' && <SummaryTab report={report} />}
        {activeTab === 'candidates' && <CandidatesTab report={report} />}
        {activeTab === 'safety' && <SafetyTab report={report} />}
        {activeTab === 'trials' && <TrialsTab report={report} />}
        {activeTab === 'recommendations' && <RecommendationsTab report={report} />}
      </div>

      {/* Footer bar */}
      <div style={{
        padding: '12px 24px',
        borderTop: '1px solid var(--line)',
        background: 'var(--bg)',
        display: 'flex', gap: 10,
      }}>
        <button
          onClick={handleExportPDF}
          style={{
            padding: '8px 16px',
            background: 'var(--navy)', color: '#fff',
            border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            fontFamily: 'var(--font-space-grotesk)',
            cursor: 'pointer',
          }}
        >
          Export as PDF
        </button>
        <button
          onClick={handleExportJSON}
          style={{
            padding: '8px 16px',
            background: 'var(--panel)', color: 'var(--navy)',
            border: '1px solid var(--line)', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            fontFamily: 'var(--font-space-grotesk)',
            cursor: 'pointer',
          }}
        >
          Export as JSON
        </button>
      </div>
    </div>
  );
}

// ---- Placeholder when no report is selected --------------------------------

function EmptyState() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--slate)', gap: 12,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 12,
        background: 'var(--bg)', border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, color: 'var(--faint)',
      }}>
        &#9741;
      </div>
      <p style={{ fontSize: 14, color: 'var(--slate)', margin: 0 }}>
        Select a report to view it here
      </p>
      <p style={{ fontSize: 12, color: 'var(--faint)', margin: 0 }}>
        Or generate a new report using the button above
      </p>
    </div>
  );
}

// ---- Sample report placeholder data ---------------------------------------

function buildSampleReportData(item: ReportListItem): ReportData {
  return {
    project_name: item.projectName,
    indication: item.indication,
    stage: item.stage,
    candidate_ids: [],
    sections: {
      executive_summary:
        `This is a sample report for ${item.projectName}. ` +
        `Connect the engine to view live scoring results for the ${item.indication} programme. ` +
        `Start the engine with \`uvicorn app.main:app --port 8000\` and click "Generate Report" to see real Bayesian scores.`,
      candidate_ranking: [],
      safety_flags: {},
      trial_landscape:
        `Live ClinicalTrials.gov integration scheduled for Phase 9. ` +
        `In a live report this section would enumerate active Phase II/III trials in ` +
        `${item.indication}, their primary endpoints, and key failure modes to avoid.`,
      recommendations: [
        `Connect the Antaria engine to generate live candidate scores for ${item.projectName}.`,
        `Run \`uvicorn app.main:app --port 8000\` from the apps/engine directory to activate live mode.`,
      ],
      metadata: {
        project_name: item.projectName,
        indication: item.indication,
        stage: item.stage,
        generated_at: item.generatedAt,
        engine_version: 'v0 (sample)',
        data_sources: ['Sample data — engine not connected'],
      },
    },
  };
}

// ---- Main component --------------------------------------------------------

export default function ReportsView() {
  const [reports, setReports] = useState<ReportListItem[]>(SEED_REPORTS);
  const [selectedId, setSelectedId] = useState<string | null>(SEED_REPORTS[0].id);
  const [showModal, setShowModal] = useState(false);

  // Try to load live sample report from engine
  useEffect(() => {
    fetch('/api/engine/reports/sample')
      .then((r) => r.ok ? r.json() : null)
      .then((data: ReportData | null) => {
        if (!data) return;
        const liveItem: ReportListItem = {
          id: 'engine-apollo',
          projectName: data.project_name,
          indication: data.indication,
          stage: data.stage,
          generatedAt: data.sections.metadata?.generated_at ?? new Date().toISOString(),
          isSample: false,
          data,
        };
        setReports((prev) => {
          // Replace or prepend
          const filtered = prev.filter((r) => r.id !== 'engine-apollo');
          return [liveItem, ...filtered];
        });
        setSelectedId('engine-apollo');
      })
      .catch(() => null);
  }, []);

  const handleGenerated = useCallback((item: ReportListItem) => {
    setReports((prev) => [item, ...prev]);
    setSelectedId(item.id);
    setShowModal(false);
  }, []);

  const selectedReport = reports.find((r) => r.id === selectedId);
  const reportData: ReportData | null = selectedReport
    ? (selectedReport.data ?? buildSampleReportData(selectedReport))
    : null;

  return (
    <>
      {/* Pulse animation */}
      <style>{`
        @keyframes antaria-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{
          width: 320, flexShrink: 0,
          borderRight: '1px solid var(--line)',
          background: 'var(--panel)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Generate button */}
          <div style={{ padding: '16px 16px 12px' }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                width: '100%', padding: '10px 0',
                background: 'var(--navy)', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                fontFamily: 'var(--font-space-grotesk)',
                cursor: 'pointer',
              }}
            >
              Generate Report
            </button>
          </div>

          {/* Report list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
            {reports.map((r) => {
              const isSelected = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '12px 12px',
                    background: isSelected ? 'var(--cyan-soft)' : 'transparent',
                    border: 'none',
                    borderLeft: isSelected ? '3px solid var(--cyan)' : '3px solid transparent',
                    borderRadius: 6, cursor: 'pointer',
                    marginBottom: 2,
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      fontSize: 13, fontWeight: 600,
                      color: isSelected ? 'var(--navy)' : 'var(--ink)',
                      lineHeight: 1.3,
                    }}>
                      {r.projectName}
                      {r.isSample && (
                        <span style={{
                          marginLeft: 6, fontSize: 10, fontWeight: 500,
                          color: 'var(--faint)', fontFamily: 'var(--font-jetbrains-mono)',
                        }}>
                          (Sample)
                        </span>
                      )}
                    </span>
                  </div>
                  <p style={{
                    margin: '2px 0 4px', fontSize: 11,
                    color: 'var(--slate)', lineHeight: 1.4,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {r.indication}
                  </p>
                  <span style={{
                    fontSize: 10, color: 'var(--faint)',
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}>
                    Generated {formatDate(r.generatedAt)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--panel)' }}>
          {reportData ? <ReportViewer report={reportData} /> : <EmptyState />}
        </div>
      </div>

      {showModal && (
        <GenerateModal
          onClose={() => setShowModal(false)}
          onGenerated={handleGenerated}
        />
      )}
    </>
  );
}
