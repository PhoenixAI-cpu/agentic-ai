'use client';

interface Props {
  anthropicConfigured: boolean;
  engineConfigured: boolean;
  supabaseConfigured: boolean;
}

function StatusDot({ configured }: { configured: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: configured ? 'var(--green)' : 'var(--amber)',
        marginRight: '0.375rem',
      }}
    />
  );
}

function StatusLabel({ configured }: { configured: boolean }) {
  return (
    <span
      style={{
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: configured ? 'var(--green)' : 'var(--amber)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <StatusDot configured={configured} />
      {configured ? 'Configured' : 'Not set'}
    </span>
  );
}

const apiRows = [
  {
    key: 'anthropicConfigured' as const,
    label: 'ANTHROPIC_API_KEY',
    note: 'Required for Ana copilot and Bayesian scoring predictions.',
  },
  {
    key: 'engineConfigured' as const,
    label: 'ENGINE_URL',
    note: 'Required for the backend scoring engine and data pipeline.',
  },
  {
    key: 'supabaseConfigured' as const,
    label: 'NEXT_PUBLIC_SUPABASE_URL',
    note: 'Required for authentication, team management, and data persistence.',
  },
];

export default function SettingsView({ anthropicConfigured, engineConfigured, supabaseConfigured }: Props) {
  const flags = { anthropicConfigured, engineConfigured, supabaseConfigured };

  const sectionStyle: React.CSSProperties = {
    background: 'var(--panel)',
    border: '1px solid var(--line)',
    borderRadius: '0.875rem',
    padding: '1.75rem',
    marginBottom: '1.5rem',
  };

  const sectionHeading: React.CSSProperties = {
    fontFamily: 'var(--font-space-grotesk)',
    fontWeight: 600,
    fontSize: '1.0625rem',
    color: 'var(--navy)',
    marginBottom: '1.25rem',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '0.875rem 0',
    borderBottom: '1px solid var(--line)',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-jetbrains-mono)',
    fontSize: '0.8125rem',
    color: 'var(--ink)',
    fontWeight: 500,
  };

  const noteStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter)',
    fontSize: '0.8rem',
    color: 'var(--slate)',
    marginTop: '0.2rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid var(--line)',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    color: 'var(--slate)',
    background: 'var(--bg)',
    fontFamily: 'var(--font-inter)',
    cursor: 'not-allowed',
  };

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
        Settings
      </h1>
      <p style={{ color: 'var(--slate)', fontSize: '0.9rem', marginBottom: '2rem', fontFamily: 'var(--font-inter)' }}>
        Manage your Antaria configuration and preferences.
      </p>

      {/* API Configuration */}
      <section style={sectionStyle}>
        <h2 style={sectionHeading}>API Configuration</h2>
        {apiRows.map((row, i) => (
          <div
            key={row.label}
            style={{
              ...rowStyle,
              borderBottom: i < apiRows.length - 1 ? '1px solid var(--line)' : 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>{row.label}</div>
              <div style={noteStyle}>{row.note}</div>
            </div>
            <div style={{ marginLeft: '1.5rem', marginTop: '0.1rem', flexShrink: 0 }}>
              <StatusLabel configured={flags[row.key]} />
            </div>
          </div>
        ))}
        <p style={{ ...noteStyle, marginTop: '1rem', fontStyle: 'italic' }}>
          Set these in your <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>.env.local</span> file. Values are never displayed here.
        </p>
      </section>

      {/* Profile */}
      <section style={sectionStyle}>
        <h2 style={sectionHeading}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ ...noteStyle, display: 'block', marginBottom: '0.375rem', fontWeight: 500 }}>Name</label>
            <input disabled value="Dr. Sarah Chen" style={inputStyle} readOnly />
          </div>
          <div>
            <label style={{ ...noteStyle, display: 'block', marginBottom: '0.375rem', fontWeight: 500 }}>Email</label>
            <input disabled value="hello@atregenix.com" style={inputStyle} readOnly />
          </div>
        </div>
        <p style={noteStyle}>
          Profile details are managed via Supabase authentication. Connect Supabase to enable profile editing and team management.
        </p>
      </section>

      {/* Appearance */}
      <section style={sectionStyle}>
        <h2 style={sectionHeading}>Appearance</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.9375rem', fontFamily: 'var(--font-inter)', marginBottom: '0.2rem' }}>
              Light theme
            </div>
            <div style={noteStyle}>Dark theme is planned for a future release.</div>
          </div>
          <span style={{
            background: 'rgba(22,163,117,0.12)',
            color: 'var(--green)',
            fontWeight: 600,
            fontSize: '0.75rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontFamily: 'var(--font-inter)',
          }}>
            Active
          </span>
        </div>
      </section>
    </div>
  );
}
