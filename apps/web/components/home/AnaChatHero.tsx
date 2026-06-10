import AnaChat from '@/components/ana/AnaChat';

export default function AnaChatHero() {
  return (
    <div
      className="rounded-2xl mb-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%)',
      }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex items-center gap-3">
        <div>
          <h2
            className="text-white text-lg font-semibold leading-none"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Ana
          </h2>
          <p className="text-white/50 text-xs mt-0.5" style={{ fontFamily: 'var(--font-inter)' }}>
            Your AI scientific copilot
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--green)' }}
          />
          <span className="text-white/50 text-xs">Ready</span>
        </div>
      </div>

      <AnaChat compact />
    </div>
  );
}
