'use client';

export default function TeamPage() {
  return (
    <div style={{ maxWidth: '640px' }}>
      <h1 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        Team
      </h1>
      <p style={{ color: 'var(--slate)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Manage your Atregenix workspace members.
      </p>

      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '0.875rem', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: '0.7rem', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Members — 1
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--faint)' }}>(Sample — connect Supabase auth to manage your real team)</span>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: '0.9rem',
          }}>SC</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9375rem' }}>Dr. Sarah Chen</div>
            <div style={{ color: 'var(--slate)', fontSize: '0.8125rem' }}>hello@atregenix.com · Founder</div>
          </div>
          <span style={{ background: 'var(--cyan-soft)', color: 'var(--blue-deep)', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '999px' }}>
            Admin
          </span>
        </div>
      </div>

      <button disabled style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.625rem 1.25rem', borderRadius: '0.75rem',
        border: '1px solid var(--line)', background: 'var(--bg)',
        color: 'var(--faint)', fontSize: '0.875rem', cursor: 'not-allowed',
      }}>
        + Invite teammate
      </button>
      <p style={{ color: 'var(--faint)', fontSize: '0.8rem', marginTop: '0.625rem' }}>
        Available after Supabase authentication is configured.
      </p>
    </div>
  );
}
