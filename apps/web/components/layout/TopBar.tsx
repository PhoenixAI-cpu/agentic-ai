import { Search, Bell } from 'lucide-react';

export default function TopBar() {
  return (
    <header
      className="fixed top-0 left-60 right-0 h-16 bg-[var(--panel)] border-b border-[var(--line)] flex items-center px-6 gap-4 z-20"
    >
      {/* Search */}
      <div className="flex-1 max-w-xl relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--faint)' }}
        />
        <input
          type="text"
          placeholder="Search molecules, targets, projects, insights..."
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border border-[var(--line)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] focus:border-transparent transition-all"
          style={{ color: 'var(--ink)', fontFamily: 'var(--font-inter)' }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-auto">
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--bg)] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} style={{ color: 'var(--slate)' }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--cyan)' }}
          />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 pl-3 border-l border-[var(--line)]">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ background: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
          >
            SC
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none" style={{ color: 'var(--ink)' }}>
              Dr. Sarah Chen
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--faint)' }}>
              Atregenix
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
