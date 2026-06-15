'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { logEvent } from '@/lib/ledger';
import type { ProjectStatus } from '@/lib/types';

interface ProjectCard {
  id: string;
  name: string;
  indication: string;
  stage: string;
  status: ProjectStatus;
  progress: number;
  molecules: number;
  leadCandidate: string | null;
  team: string[];
  lastActivity: string;
  isSample?: boolean;
}

const SEED_PROJECTS: ProjectCard[] = [
  {
    id: 'apollo',
    name: 'Project APOLLO',
    indication: 'EGFR-driven non-small cell lung cancer',
    stage: 'Lead Optimisation',
    status: 'Active',
    progress: 67,
    molecules: 8,
    leadCandidate: 'AX-7291',
    team: ['SC', 'JM', 'RP'],
    lastActivity: 'Scored 3 analogues, 2 days ago',
    isSample: true,
  },
  {
    id: 'meridian',
    name: 'Project MERIDIAN',
    indication: 'KRAS G12C colorectal/lung cancer',
    stage: 'Hit-to-Lead',
    status: 'Active',
    progress: 34,
    molecules: 14,
    leadCandidate: 'AX-6104',
    team: ['SC', 'DL'],
    lastActivity: 'Ana drafted a trial-landscape brief, 4 days ago',
    isSample: true,
  },
  {
    id: 'cardinal',
    name: 'Project CARDINAL',
    indication: 'CNS neuroinflammation (TREM2)',
    stage: 'Hit Identification',
    status: 'Planning',
    progress: 12,
    molecules: 3,
    leadCandidate: null,
    team: ['SC'],
    lastActivity: 'Target dossier compiled, 1 week ago',
    isSample: true,
  },
];

const statusStyles: Record<ProjectStatus, { bg: string; text: string }> = {
  Active: { bg: '#E8F8F3', text: '#16A375' },
  Planning: { bg: 'var(--cyan-soft)', text: 'var(--blue-deep)' },
  Paused: { bg: '#FEF8EC', text: '#D9962B' },
  Completed: { bg: 'var(--bg)', text: 'var(--faint)' },
};

const STAGES = ['Target Discovery', 'Hit Identification', 'Hit-to-Lead', 'Lead Optimisation'];

function Avatars({ team }: { team: string[] }) {
  return (
    <div className="flex -space-x-2">
      {team.map((initials, i) => (
        <span
          key={i}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white border-2 border-[var(--panel)]"
          style={{
            background: i % 2 === 0 ? 'var(--blue)' : 'var(--cyan)',
            fontFamily: 'var(--font-jetbrains-mono)',
          }}
        >
          {initials}
        </span>
      ))}
    </div>
  );
}

export default function ProjectsView() {
  const [projects, setProjects] = useState<ProjectCard[]>(SEED_PROJECTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', indication: '', stage: STAGES[1] });

  const createProject = () => {
    const name = form.name.trim();
    if (!name) return;
    const newProject: ProjectCard = {
      id: `proj-${Date.now()}`,
      name,
      indication: form.indication.trim() || 'Indication to be defined',
      stage: form.stage,
      status: 'Planning',
      progress: 0,
      molecules: 0,
      leadCandidate: null,
      team: ['SC'],
      lastActivity: 'Created just now',
    };
    setProjects((prev) => [newProject, ...prev]);
    void logEvent({
      actor: 'User',
      action: 'Created project',
      subject: name,
      detail: { indication: newProject.indication, stage: newProject.stage },
    });
    setForm({ name: '', indication: '', stage: STAGES[1] });
    setModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)' }}
          >
            Projects
          </h1>
          <p className="text-sm" style={{ color: 'var(--slate)' }}>
            Discovery programmes and their lead candidates.{' '}
            <span style={{ color: 'var(--faint)' }}>(Sample data)</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--blue)' }}
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => {
          const sStyle = statusStyles[p.status];
          return (
            <div
              key={p.id}
              className="rounded-xl border border-[var(--line)] p-5 hover:border-[var(--cyan)] transition-colors"
              style={{ background: 'var(--panel)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
                    >
                      {p.name}
                    </h3>
                    {p.isSample && (
                      <span className="text-[10px]" style={{ color: 'var(--faint)' }}>
                        Sample
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--slate)' }}>
                    {p.indication}
                  </p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0"
                  style={{ background: sStyle.bg, color: sStyle.text }}
                >
                  {p.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: 'var(--slate)' }}>
                <span>{p.stage}</span>
                <span style={{ color: 'var(--line)' }}>|</span>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                  {p.molecules} molecules
                </span>
                {p.leadCandidate && (
                  <>
                    <span style={{ color: 'var(--line)' }}>|</span>
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        background: 'var(--cyan-soft)',
                        color: 'var(--blue-deep)',
                        fontFamily: 'var(--font-jetbrains-mono)',
                      }}
                    >
                      Lead {p.leadCandidate}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.progress}%`,
                      background: 'linear-gradient(90deg, var(--blue) 0%, var(--cyan) 100%)',
                    }}
                  />
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {p.progress}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <Avatars team={p.team} />
                <span className="text-xs" style={{ color: 'var(--faint)' }}>
                  {p.lastActivity}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10, 27, 61, 0.4)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="rounded-xl border border-[var(--line)] w-full max-w-md p-6"
            style={{ background: 'var(--panel)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
              >
                New Project
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="p-1 rounded-md hover:bg-[var(--bg)]"
                style={{ color: 'var(--faint)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--slate)' }}>
                  Project name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Project ORION"
                  className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                  style={{ color: 'var(--ink)', background: 'var(--bg)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--slate)' }}>
                  Indication
                </label>
                <input
                  type="text"
                  value={form.indication}
                  onChange={(e) => setForm((f) => ({ ...f, indication: e.target.value }))}
                  placeholder="e.g. Pancreatic cancer"
                  className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                  style={{ color: 'var(--ink)', background: 'var(--bg)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--slate)' }}>
                  Stage
                </label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                  className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                  style={{ color: 'var(--ink)', background: 'var(--bg)' }}
                >
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--line)]"
                style={{ color: 'var(--slate)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createProject}
                disabled={!form.name.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--blue)' }}
              >
                Create project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
