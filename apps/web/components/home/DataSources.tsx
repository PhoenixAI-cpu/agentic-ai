import { DataSourceStatus } from '@/lib/types';

interface DataSource {
  name: string;
  description: string;
  records: string;
  status: DataSourceStatus;
}

const sources: DataSource[] = [
  { name: 'Publications', description: 'PubMed, bioRxiv, literature corpus', records: '2.4M records', status: 'Active' },
  { name: 'Protein Database', description: 'UniProt / PDB', records: '847K entries', status: 'Active' },
  { name: 'Compound Database', description: 'ChEMBL', records: '2.1M compounds', status: 'Active' },
  { name: 'Clinical Trials', description: 'ClinicalTrials.gov, WHO ICTRP', records: '428K trials', status: 'Active' },
  { name: 'Regulatory Data', description: 'FDA, EMA submissions', records: '94K submissions', status: 'Active' },
  { name: 'Real-World Evidence', description: 'EHR, claims datasets', records: '—', status: 'Not connected' },
];

export default function DataSources() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          Data Sources
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
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                Source
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                Records
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => {
              const isConnected = source.status === 'Active';
              return (
                <tr
                  key={source.name}
                  className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm" style={{ color: 'var(--ink)', fontFamily: 'var(--font-inter)' }}>
                      {source.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--faint)' }}>
                      {source.description}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-sm"
                      style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      {source.records}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: isConnected ? 'var(--green)' : 'var(--faint)' }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: isConnected ? 'var(--green)' : 'var(--faint)' }}
                      >
                        {source.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isConnected && (
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-90"
                        style={{ background: 'var(--blue)', fontFamily: 'var(--font-inter)' }}
                      >
                        Connect
                      </button>
                    )}
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
