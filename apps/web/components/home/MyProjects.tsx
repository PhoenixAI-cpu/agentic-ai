import { Project, ProjectStatus } from '@/lib/types';

const projects: Project[] = [
  {
    id: 'apollo',
    name: 'Project APOLLO',
    description: 'EGFR inhibitor series',
    progress: 67,
    molecules: 8,
    status: 'Active',
  },
  {
    id: 'meridian',
    name: 'Project MERIDIAN',
    description: 'KRAS oncology',
    progress: 34,
    molecules: 14,
    status: 'Active',
  },
  {
    id: 'cardinal',
    name: 'Project CARDINAL',
    description: 'CNS neuroinflammation',
    progress: 12,
    molecules: 3,
    status: 'Planning',
  },
];

const statusStyles: Record<ProjectStatus, { bg: string; text: string }> = {
  Active: { bg: '#E8F8F3', text: '#16A375' },
  Planning: { bg: 'var(--cyan-soft)', text: 'var(--blue-deep)' },
  Paused: { bg: '#FEF8EC', text: '#D9962B' },
  Completed: { bg: 'var(--bg)', text: 'var(--faint)' },
};

export default function MyProjects() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          My Projects
        </h2>
        <span className="text-xs" style={{ color: 'var(--faint)' }}>Sample data</span>
      </div>
      <div className="space-y-3">
        {projects.map((project) => {
          const sStyle = statusStyles[project.status];
          return (
            <div
              key={project.id}
              className="rounded-xl border border-[var(--line)] px-5 py-4 flex items-center gap-4 hover:border-[var(--cyan)] transition-colors cursor-pointer"
              style={{ background: 'var(--panel)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    {project.name}
                  </h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ background: sStyle.bg, color: sStyle.text }}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--slate)' }}>
                  {project.description} &middot; {project.molecules} molecules
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${project.progress}%`,
                        background: `linear-gradient(90deg, var(--blue) 0%, var(--cyan) 100%)`,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium flex-shrink-0"
                    style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    {project.progress}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
