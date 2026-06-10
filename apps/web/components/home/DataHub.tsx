'use client';

import { useState } from 'react';
import { DataFile, FileType } from '@/lib/types';
import UploadDropzone from '@/components/data/UploadDropzone';

const dataCounts = [
  { label: 'Datasets', value: 24 },
  { label: 'Files', value: 189 },
  { label: 'Tables', value: 47 },
  { label: 'Connections', value: 8 },
];

const sampleFiles: DataFile[] = [
  { name: 'compound_library_v3.sdf', type: 'SDF', addedAt: '3 hours ago' },
  { name: 'trial_outcomes_q4.csv', type: 'CSV', addedAt: 'Yesterday' },
  { name: 'uniprot_targets.xlsx', type: 'XLSX', addedAt: '2 days ago' },
  { name: 'literature_review.pdf', type: 'PDF', addedAt: '3 days ago' },
  { name: 'screening_hits.csv', type: 'CSV', addedAt: '5 days ago' },
];

const fileTypeStyles: Record<FileType, { bg: string; text: string }> = {
  SDF: { bg: 'var(--cyan-soft)', text: 'var(--blue-deep)' },
  CSV: { bg: '#E8F8F3', text: '#16A375' },
  XLSX: { bg: '#E8F8F3', text: '#16A375' },
  PDF: { bg: '#FEF2F2', text: '#E0524D' },
  FASTA: { bg: '#FEF8EC', text: '#D9962B' },
};

export default function DataHub() {
  const [uploaded, setUploaded] = useState<DataFile[]>([]);

  const recentFiles = [...uploaded, ...sampleFiles].slice(0, 5);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          Your Data Hub
        </h2>
        <span className="text-xs" style={{ color: 'var(--faint)' }}>Sample data</span>
      </div>

      <div
        className="rounded-xl border border-[var(--line)] overflow-hidden"
        style={{ background: 'var(--panel)' }}
      >
        {/* Counts row */}
        <div className="grid grid-cols-4 divide-x divide-[var(--line)] border-b border-[var(--line)]">
          {dataCounts.map((item) => (
            <div key={item.label} className="px-4 py-3 text-center">
              <p
                className="text-xl font-semibold"
                style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
              >
                {item.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--faint)' }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
          {/* Recent files */}
          <div className="p-4">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              Recently Added
            </p>
            <ul className="space-y-2">
              {recentFiles.map((file) => {
                const fStyle = fileTypeStyles[file.type];
                return (
                  <li key={`${file.name}-${file.addedAt}`} className="flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
                      style={{ background: fStyle.bg, color: fStyle.text, fontFamily: 'var(--font-jetbrains-mono)' }}
                    >
                      {file.type}
                    </span>
                    <span
                      className="text-xs flex-1 truncate"
                      style={{ color: 'var(--ink)', fontFamily: 'var(--font-inter)' }}
                    >
                      {file.name}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--faint)' }}>
                      {file.addedAt}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Upload area */}
          <div className="p-4 flex flex-col">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              Upload Files
            </p>
            <UploadDropzone
              onUploaded={(file) =>
                setUploaded((prev) => [
                  { name: file.name, type: file.type, addedAt: 'Just now' },
                  ...prev,
                ])
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
