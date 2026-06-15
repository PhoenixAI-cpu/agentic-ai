const StatusDot = ({ ok }: { ok: boolean }) => (
  <span style={{
    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
    background: ok ? 'var(--green)' : 'var(--amber)', flexShrink: 0,
  }} />
);

const configured = {
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  engine: !!process.env.ENGINE_URL,
  supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
};

export const metadata = { title: 'Settings — Antaria' };

export default function SettingsPage() {
  const apiRows = [
    { label: 'ANTHROPIC_API_KEY', ok: configured.anthropic, note: 'Required for Ana. Enables live AI copilot responses.' },
    { label: 'ENGINE_URL', ok: configured.engine, note: 'Python scoring engine. Enables live Bayesian scores and reports.' },
    { label: 'NEXT_PUBLIC_SUPABASE_URL', ok: configured.supabase, note: 'Supabase project. Enables auth, uploads, and persistent ledger.' },
  ];

  return (
    <div style={{ maxWidth: '640px' }}>
      <h1 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        Settings
      </h1>
      <p style={{ color: 'var(--slate)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
        Configure your Antaria workspace.
      </p>

      {/* API Configuration */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: '1.0625rem', fontWeight: 600, marginBottom: '1rem' }}>
          API Configuration
        </h2>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '0.875rem', overflow: 'hidden' }}>
          {apiRows.map((row, i) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              padding: '1rem 1.25rem',
              borderBottom: i < apiRows.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <StatusDot ok={row.ok} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: '0.8rem', color: 'var(--ink)', marginBottom: '0.2rem' }}>
                  {row.label}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--slate)' }}>{row.note}</div>
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '999px',
                background: row.ok ? '#E8F8F3' : '#FEF8EC',
                color: row.ok ? 'var(--green)' : 'var(--amber)',
                whiteSpace: 'nowrap',
              }}>
                {row.ok ? 'Configured' : 'Not set'}
              </span>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--faint)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
          Set these in <code style={{ fontFamily: 'var(--font-jetbrains-mono)', background: 'var(--bg)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>.env.local</code> in the web app directory. Values are never shown here.
        </p>
      </section>

      {/* Profile */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: '1.0625rem', fontWeight: 600, marginBottom: '1rem' }}>
          Profile
        </h2>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '0.875rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {['Full name', 'Email address'].map((label) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--slate)', marginBottom: '0.375rem' }}>{label}</label>
              <input disabled placeholder={label === 'Full name' ? 'Dr. Sarah Chen' : 'sarah@atregenix.com'} style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
                border: '1px solid var(--line)', background: 'var(--bg)',
                color: 'var(--faint)', fontSize: '0.9rem', cursor: 'not-allowed',
                boxSizing: 'border-box',
              }} />
            </div>
          ))}
          <p style={{ color: 'var(--faint)', fontSize: '0.8rem' }}>
            Authentication is configured via Supabase. Set up your Supabase project and run the migration to enable sign-in.
          </p>
        </div>
      </section>

      {/* Appearance */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: '1.0625rem', fontWeight: 600, marginBottom: '1rem' }}>
          Appearance
        </h2>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '0.875rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: '0.2rem' }}>Light theme</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate)' }}>Dark workspace theme planned for a future release.</div>
            </div>
            <span style={{ background: '#E8F8F3', color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '999px' }}>Active</span>
          </div>
        </div>
      </section>
    </div>
  );
}
