'use client';

export default function TeamView() {
  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: '720px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontWeight: 700,
          fontSize: '1.5rem',
          color: 'var(--navy)',
          marginBottom: '0.375rem',
        }}
      >
        Team
      </h1>
      <p style={{ color: 'var(--slate)', fontSize: '0.9rem', marginBottom: '2rem', fontFamily: 'var(--font-inter)' }}>
        Manage your Atregenix workspace.
      </p>

      {/* Member card */}
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '0.875rem',
          padding: '1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: '0.9375rem',
              flexShrink: 0,
            }}
          >
            SC
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)', fontSize: '0.9375rem' }}>
              Dr. Sarah Chen
            </div>
            <div style={{ color: 'var(--slate)', fontSize: '0.8125rem', fontFamily: 'var(--font-inter)', marginTop: '0.125rem' }}>
              Founder · hello@atregenix.com
            </div>
          </div>
        </div>
        <span
          style={{
            background: 'var(--cyan-soft)',
            color: 'var(--blue)',
            fontWeight: 600,
            fontSize: '0.75rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontFamily: 'var(--font-inter)',
            flexShrink: 0,
          }}
        >
          Admin
        </span>
      </div>

      {/* Invite button */}
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '0.875rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
              Invite a teammate
            </div>
            <div style={{ color: 'var(--slate)', fontSize: '0.8125rem', fontFamily: 'var(--font-inter)' }}>
              Available after Supabase authentication is configured.
            </div>
          </div>
          <button
            disabled
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              color: 'var(--faint)',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.625rem',
              cursor: 'not-allowed',
              fontFamily: 'var(--font-inter)',
            }}
          >
            Invite teammate
          </button>
        </div>
      </div>

      <p
        style={{
          color: 'var(--faint)',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-inter)',
          fontStyle: 'italic',
        }}
      >
        (Sample — connect Supabase auth to manage your real team)
      </p>
    </div>
  );
}
