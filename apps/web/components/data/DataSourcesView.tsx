'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Dna,
  FlaskConical,
  Stethoscope,
  Scale,
  Activity,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface SourceCard {
  name: string;
  icon: React.ReactNode;
  status: 'Active' | 'Not connected';
  records: string;
  feeds: string;
}

const SOURCES: SourceCard[] = [
  {
    name: 'Publications',
    icon: <BookOpen size={18} />,
    status: 'Active',
    records: '34.2M records',
    feeds: 'Feeds literature review and target hypothesis generation.',
  },
  {
    name: 'Protein Database',
    icon: <Dna size={18} />,
    status: 'Active',
    records: '248K structures',
    feeds: 'Feeds target validation and binding-site analysis.',
  },
  {
    name: 'Compound Database',
    icon: <FlaskConical size={18} />,
    status: 'Active',
    records: '112M compounds',
    feeds: 'Feeds candidate scoring and similarity searches.',
  },
  {
    name: 'Clinical Trials',
    icon: <Stethoscope size={18} />,
    status: 'Active',
    records: '492K trials',
    feeds: 'Feeds trial-failure analysis and indication scoping.',
  },
  {
    name: 'Regulatory Data',
    icon: <Scale size={18} />,
    status: 'Not connected',
    records: '86K documents',
    feeds: 'Feeds approval-pathway and labelling intelligence.',
  },
  {
    name: 'Real-World Evidence',
    icon: <Activity size={18} />,
    status: 'Not connected',
    records: '1.4B data points',
    feeds: 'Feeds safety-signal detection and outcomes modelling.',
  },
];

interface DatasetRow {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number | null;
  uploaded_at: string;
  sample?: boolean;
}

const SAMPLE_DATASETS: DatasetRow[] = [
  {
    id: 'sample-1',
    name: 'compound_library_v3.sdf',
    file_type: 'sdf',
    size_bytes: 8_421_376,
    uploaded_at: '2026-06-07T09:14:00Z',
    sample: true,
  },
  {
    id: 'sample-2',
    name: 'trial_outcomes_q4.csv',
    file_type: 'csv',
    size_bytes: 1_245_900,
    uploaded_at: '2026-06-05T16:40:00Z',
    sample: true,
  },
  {
    id: 'sample-3',
    name: 'uniprot_targets.xlsx',
    file_type: 'xlsx',
    size_bytes: 482_330,
    uploaded_at: '2026-06-03T11:02:00Z',
    sample: true,
  },
];

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function DataSourcesView() {
  const [datasets, setDatasets] = useState<DatasetRow[]>(SAMPLE_DATASETS);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    setConfigured(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('datasets')
          .select('id, name, file_type, size_bytes, uploaded_at')
          .order('uploaded_at', { ascending: false })
          .limit(50);
        if (!error && data && data.length > 0) {
          setDatasets(data as DatasetRow[]);
        }
      } catch {
        // Keep sample rows.
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h1
        className="text-2xl font-semibold mb-1"
        style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)' }}
      >
        Data Sources
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)' }}>
        Connected knowledge bases that feed Ana, the scoring engine, and your agents.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {SOURCES.map((source) => (
          <div
            key={source.name}
            className="rounded-xl border border-[var(--line)] p-4 flex flex-col"
            style={{ background: 'var(--panel)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: 'var(--blue)' }}>{source.icon}</span>
              <h2
                className="text-sm font-semibold flex-1"
                style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
              >
                {source.name}
              </h2>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: source.status === 'Active' ? '#E8F8F3' : 'var(--bg)',
                  color: source.status === 'Active' ? 'var(--green)' : 'var(--faint)',
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}
              >
                {source.status}
              </span>
            </div>
            <p
              className="text-xs mb-1"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              {source.records}{' '}
              <span style={{ color: 'var(--faint)' }}>(sample)</span>
            </p>
            <p
              className="text-xs flex-1 mb-3"
              style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)' }}
            >
              {source.feeds}
            </p>
            <button
              type="button"
              className="self-start text-xs px-3 py-1.5 rounded-lg border border-[var(--line)] transition-colors hover:border-[var(--cyan)]"
              style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)', background: 'transparent' }}
            >
              {source.status === 'Active' ? 'Configure' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          User datasets
        </h2>
        {!configured && (
          <span className="text-xs" style={{ color: 'var(--faint)', fontFamily: 'var(--font-inter)' }}>
            Connect Supabase to enable uploads
          </span>
        )}
      </div>

      <div
        className="rounded-xl border border-[var(--line)] overflow-hidden"
        style={{ background: 'var(--panel)' }}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--line)]">
              {['Name', 'Type', 'Size', 'Uploaded', ''].map((heading, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--faint)', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {datasets.map((ds) => (
              <tr key={ds.id}>
                <td
                  className="px-4 py-2.5 text-xs"
                  style={{ color: 'var(--ink)', fontFamily: 'var(--font-inter)' }}
                >
                  {ds.name}
                </td>
                <td
                  className="px-4 py-2.5 text-xs uppercase"
                  style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {ds.file_type}
                </td>
                <td
                  className="px-4 py-2.5 text-xs"
                  style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {formatSize(ds.size_bytes)}
                </td>
                <td
                  className="px-4 py-2.5 text-xs"
                  style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {formatDate(ds.uploaded_at)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {ds.sample && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        background: 'var(--bg)',
                        color: 'var(--faint)',
                        fontFamily: 'var(--font-jetbrains-mono)',
                      }}
                    >
                      Sample
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
