export const metadata = {
  title: 'Antaria — AI-Powered Drug Discovery',
};

export default function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%)' }}>
      <div className="text-center max-w-2xl">
        {/* Logo mark */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="28" height="28" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M11 2 L12.2 9.8 L20 11 L12.2 12.2 L11 20 L9.8 12.2 L2 11 L9.8 9.8 Z"
              fill="#1FB6D6"
            />
          </svg>
          <span
            className="text-white text-2xl font-semibold tracking-[0.28em]"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            ANTARIA
          </span>
        </div>

        <h1
          className="text-4xl font-semibold text-white leading-tight mb-4"
          style={{ fontFamily: 'var(--font-space-grotesk)' }}
        >
          AI-powered drug discovery,<br />
          <span style={{ color: 'var(--cyan)' }}>built for science.</span>
        </h1>
        <p
          className="text-lg mb-8"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-inter)' }}
        >
          Antaria combines Bayesian ML, large language models, and curated biomedical
          data to accelerate every stage of the drug-discovery pipeline.
        </p>

        <a
          href="/home"
          className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--blue)', fontFamily: 'var(--font-inter)' }}
        >
          Open platform
        </a>

        <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          By Atregenix — early access
        </p>
      </div>
    </div>
  );
}
