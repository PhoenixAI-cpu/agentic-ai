import {
  BookOpen,
  Lightbulb,
  FlaskConical,
  BarChart2,
  ClipboardList,
  FileText,
} from 'lucide-react';
import { AgentStatus } from '@/lib/types';

interface Agent {
  name: string;
  status: AgentStatus;
  lastRun: string;
  icon: React.ElementType;
}

const agents: Agent[] = [
  { name: 'Literature Review', status: 'Completed', lastRun: '2 hours ago', icon: BookOpen },
  { name: 'Hypothesis Generation', status: 'Completed', lastRun: '3 hours ago', icon: Lightbulb },
  { name: 'Molecular Design', status: 'In progress', lastRun: 'Running now', icon: FlaskConical },
  { name: 'Data Analysis', status: 'In progress', lastRun: 'Running now', icon: BarChart2 },
  { name: 'Experimental Planning', status: 'Queued', lastRun: 'Scheduled', icon: ClipboardList },
  { name: 'Reporting', status: 'Queued', lastRun: 'Scheduled', icon: FileText },
];

const statusStyles: Record<AgentStatus, { bg: string; text: string; dot: string }> = {
  Completed: { bg: '#E8F8F3', text: '#16A375', dot: '#16A375' },
  'In progress': { bg: '#FEF8EC', text: '#D9962B', dot: '#D9962B' },
  Queued: { bg: 'var(--bg)', text: 'var(--faint)', dot: 'var(--faint)' },
};

export default function AgentsActivity() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          AI Agents Activity
        </h2>
        <span className="text-xs" style={{ color: 'var(--faint)' }}>Sample data</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent) => {
          const styles = statusStyles[agent.status];
          const Icon = agent.icon;
          return (
            <div
              key={agent.name}
              className="rounded-xl p-4 border border-[var(--line)]"
              style={{ background: 'var(--panel)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--cyan-soft)' }}
                >
                  <Icon size={16} style={{ color: 'var(--blue)' }} />
                </div>
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: styles.bg, color: styles.text }}
                >
                  {agent.status === 'In progress' && (
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: styles.dot }}
                    />
                  )}
                  {agent.status !== 'In progress' && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: styles.dot }}
                    />
                  )}
                  {agent.status}
                </span>
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-inter)' }}
              >
                {agent.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--faint)' }}>
                {agent.lastRun}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
