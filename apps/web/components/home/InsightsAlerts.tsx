import { AlertTriangle, TestTube, FileText, Lightbulb, type LucideIcon } from 'lucide-react';
import { AlertType } from '@/lib/types';

interface Alert {
  type: AlertType;
  title: string;
  body: string;
  icon: LucideIcon;
  borderColor: string;
  iconColor: string;
  iconBg: string;
}

const alerts: Alert[] = [
  {
    type: 'safety',
    title: 'Safety Alert',
    body: 'Hepatotoxicity signal in AX-5892 — review recommended',
    icon: AlertTriangle,
    borderColor: 'var(--red)',
    iconColor: 'var(--red)',
    iconBg: '#FEF2F2',
  },
  {
    type: 'trial',
    title: 'Trial Update',
    body: 'Phase II CARDINAL study — interim results available',
    icon: TestTube,
    borderColor: 'var(--blue)',
    iconColor: 'var(--blue)',
    iconBg: 'var(--cyan-soft)',
  },
  {
    type: 'regulatory',
    title: 'Regulatory Update',
    body: 'EMA guideline update on genotoxicity assessment',
    icon: FileText,
    borderColor: 'var(--amber)',
    iconColor: 'var(--amber)',
    iconBg: '#FEF8EC',
  },
  {
    type: 'opportunity',
    title: 'Opportunity',
    body: 'Novel KRAS G12C target — 3 new binding modes identified',
    icon: Lightbulb,
    borderColor: 'var(--green)',
    iconColor: 'var(--green)',
    iconBg: '#E8F8F3',
  },
];

export default function InsightsAlerts() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          Insights &amp; Alerts
        </h2>
        <span className="text-xs" style={{ color: 'var(--faint)' }}>Sample data</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.type}
              className="rounded-xl border border-[var(--line)] p-4 border-l-4"
              style={{
                background: 'var(--panel)',
                borderLeftColor: alert.borderColor,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: alert.iconBg }}
                >
                  <Icon size={14} style={{ color: alert.iconColor }} />
                </div>
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: alert.iconColor, fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {alert.title}
                </span>
              </div>
              <p className="text-sm leading-snug" style={{ color: 'var(--ink)', fontFamily: 'var(--font-inter)' }}>
                {alert.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
