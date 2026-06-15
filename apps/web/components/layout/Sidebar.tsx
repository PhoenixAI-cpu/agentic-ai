'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageSquare,
  FlaskConical,
  Target,
  Library,
  BarChart2,
  BookOpen,
  GitBranch,
  FolderKanban,
  TestTube,
  ClipboardList,
  FileText,
  Database,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: '',
    items: [
      { label: 'Home', href: '/home', icon: Home },
      { label: 'Ana', href: '/ana', icon: MessageSquare },
    ],
  },
  {
    title: 'Discovery',
    items: [
      { label: 'Molecular Explorer', href: '/molecules', icon: FlaskConical },
      { label: 'Targets & Pathways', href: '/targets', icon: Target },
      { label: 'Compound Libraries', href: '/molecules', icon: Library },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Scoring & Predictions', href: '/molecules', icon: BarChart2 },
      { label: 'Evidence Ledger', href: '/ledger', icon: BookOpen },
      { label: 'Scenario Simulator', href: '/scenarios', icon: GitBranch },
    ],
  },
  {
    title: 'Pipeline',
    items: [
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Experiments', href: '/projects', icon: TestTube },
      { label: 'Trials', href: '/projects', icon: ClipboardList },
      { label: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Data Sources', href: '/data-sources', icon: Database },
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Team', href: '/team', icon: Users },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-full w-60 bg-[var(--panel)] border-r border-[var(--line)] flex flex-col z-30 overflow-y-auto"
      style={{ width: '240px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-[var(--line)]">
        {/* 4-point star mark */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path
            d="M11 2 L12.2 9.8 L20 11 L12.2 12.2 L11 20 L9.8 12.2 L2 11 L9.8 9.8 Z"
            fill="var(--cyan)"
          />
        </svg>
        <span
          className="text-[var(--navy)] font-semibold text-base tracking-[0.28em] uppercase"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          ANTARIA
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="mb-4">
            {section.title && (
              <p
                className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--faint)', fontFamily: 'var(--font-inter)' }}
              >
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors relative ${
                        isActive
                          ? 'bg-[var(--cyan-soft)] text-[var(--navy)] font-medium'
                          : 'text-[var(--slate)] hover:bg-[var(--bg)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                          style={{ background: 'var(--cyan)' }}
                        />
                      )}
                      <Icon size={16} className="flex-shrink-0" />
                      <span style={{ fontFamily: 'var(--font-inter)' }}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Version */}
      <div className="px-5 py-3 border-t border-[var(--line)]">
        <p className="text-[10px]" style={{ color: 'var(--faint)', fontFamily: 'var(--font-jetbrains-mono)' }}>
          v0.1.0-alpha
        </p>
      </div>
    </aside>
  );
}
