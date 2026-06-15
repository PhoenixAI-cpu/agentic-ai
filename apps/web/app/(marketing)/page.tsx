const StarMark = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 2 L12.2 9.8 L20 11 L12.2 12.2 L11 20 L9.8 12.2 L2 11 L9.8 9.8 Z" fill="#1FB6D6" />
  </svg>
);

export const metadata = {
  title: 'Antaria — Decision Intelligence for Drug Development',
  description:
    'Antaria combines Bayesian ML, curated biomedical data, and an AI scientific copilot to help drug discovery teams make better decisions, faster.',
};

export default function MarketingPage() {
  return (
    <div style={{ fontFamily: 'var(--font-inter)', color: 'var(--ink)', background: '#fff' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff', borderBottom: '1px solid var(--line)',
        padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <StarMark size={22} />
          <span style={{
            fontFamily: 'var(--font-space-grotesk)', fontWeight: 600,
            letterSpacing: '0.28em', color: 'var(--navy)', fontSize: '1rem',
          }}>ANTARIA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/home" style={{ color: 'var(--slate)', fontSize: '0.875rem', textDecoration: 'none' }}>
            Sign in
          </a>
          <a href="mailto:hello@atregenix.com?subject=Antaria early access" style={{
            background: 'var(--navy)', color: '#fff', fontSize: '0.875rem',
            fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '0.75rem',
            textDecoration: 'none',
          }}>
            Request access
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0A1B3D 0%, #0E2A55 100%)',
        padding: '6rem 2rem 5rem', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-jetbrains-mono)', color: '#1FB6D6',
            fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            Decision Intelligence for Drug Development
          </p>
          <h1 style={{
            fontFamily: 'var(--font-space-grotesk)', color: '#fff',
            fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', fontWeight: 600,
            lineHeight: 1.15, marginBottom: '1.25rem',
          }}>
            The platform that turns biomedical complexity into clear decisions.
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.65)', fontSize: '1.125rem',
            lineHeight: 1.7, maxWidth: '580px', margin: '0 auto 2.5rem',
          }}>
            Antaria combines Bayesian ML, curated biomedical data, and an AI scientific
            copilot to help drug discovery teams move faster — with evidence.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:hello@atregenix.com?subject=Antaria early access" style={{
              background: '#1FB6D6', color: '#0A1B3D', fontWeight: 700,
              padding: '0.75rem 1.75rem', borderRadius: '0.75rem',
              fontSize: '0.9375rem', textDecoration: 'none',
            }}>
              Request access
            </a>
            <a href="mailto:hello@atregenix.com?subject=Book a call — Antaria" style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600,
              padding: '0.75rem 1.75rem', borderRadius: '0.75rem',
              fontSize: '0.9375rem', textDecoration: 'none',
            }}>
              Book a call
            </a>
          </div>

          {/* Hero stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem', marginTop: '3.5rem',
          }}>
            {[
              { value: '90%+', label: 'Clinical trial failure rate', note: 'Industry average' },
              { value: '12–15 yrs', label: 'Average development timeline', note: 'Industry average' },
              { value: '$2.6B', label: 'Average cost to approval', note: 'Industry average' },
            ].map((s) => (
              <div key={s.value} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.875rem', padding: '1.5rem 1rem', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-space-grotesk)', color: '#fff',
                  fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem',
                }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>{s.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>({s.note})</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#1FB6D6', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              The Challenge
            </p>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 600, lineHeight: 1.2, marginBottom: '1.25rem' }}>
              Drug development is expensive, slow, and opaque.
            </h2>
            <p style={{ color: 'var(--slate)', lineHeight: 1.75, marginBottom: '1.75rem' }}>
              Over 90% of drug candidates fail in clinical trials. The data exists to make better
              decisions — it is scattered across hundreds of disconnected sources, locked in PDFs,
              and too complex to synthesise manually at the speed science demands.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Fragmented data sources', 'Unexplained AI predictions', 'Trial failure patterns missed'].map((t) => (
                <span key={t} style={{
                  background: 'var(--cyan-soft)', color: 'var(--blue-deep)',
                  fontSize: '0.8125rem', fontWeight: 500,
                  padding: '0.375rem 0.875rem', borderRadius: '999px',
                }}>{t}</span>
              ))}
            </div>
          </div>
          {/* Data convergence visual */}
          <div style={{ position: 'relative', height: '220px', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              {['ChEMBL', 'UniProt', 'ClinicalTrials.gov'].map((src, i) => (
                <div key={src} style={{
                  background: '#fff', border: '1px solid var(--line)',
                  borderRadius: '0.625rem', padding: '0.625rem 1rem',
                  fontSize: '0.8125rem', fontWeight: 500, color: 'var(--slate)',
                  fontFamily: 'var(--font-jetbrains-mono)',
                  marginLeft: `${i * 8}px`,
                }}>{src}</div>
              ))}
            </div>
            <div style={{ padding: '0 1rem', color: 'var(--faint)', fontSize: '1.25rem' }}>→</div>
            <div style={{
              background: 'var(--cyan-soft)', border: '2px solid #1FB6D6',
              borderRadius: '0.875rem', padding: '1.25rem 1.5rem', textAlign: 'center',
            }}>
              <StarMark size={18} />
              <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: 'var(--navy)', fontSize: '0.9375rem', marginTop: '0.375rem' }}>Antaria</div>
            </div>
          </div>
        </div>
      </section>

      {/* What Antaria does */}
      <section style={{ padding: '5rem 2rem', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#1FB6D6', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>The Platform</p>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 600 }}>
              One platform. All the data. Every decision explained.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            {[
              { title: 'Bayesian Scoring', body: 'Every score carries a calibrated confidence interval. No black boxes — you see exactly what data drove each prediction and why.', icon: '▦' },
              { title: 'Ana, your scientific copilot', body: 'Ask Ana anything about your pipeline. She synthesises evidence across molecular, clinical, and real-world data — and always shows her reasoning.', icon: '✦' },
              { title: 'Evidence Ledger', body: 'An append-only record of every analysis, score, and AI action. Reproducible, auditable, and always explainable to collaborators and regulators.', icon: '▤' },
              { title: 'Decision Intelligence Reports', body: 'Generate structured, evidenced go/no-go reports in minutes. The paid deliverable that turns Antaria into a revenue product.', icon: '▨' },
            ].map((f) => (
              <div key={f.title} style={{
                background: '#fff', border: '1px solid var(--line)',
                borderRadius: '0.875rem', padding: '1.75rem',
              }}>
                <div style={{ fontSize: '1.25rem', color: '#1FB6D6', marginBottom: '0.875rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.625rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--slate)', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explainability */}
      <section style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #0A1B3D 0%, #0E2A55 100%)' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#1FB6D6', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>The Differentiator</p>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: '#fff', fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 600, lineHeight: 1.2, marginBottom: '1.25rem' }}>
              Explainability is not a feature — it is the foundation.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
              Every prediction Antaria makes decomposes into named inputs, stated assumptions,
              and calibrated uncertainty. Scientists see the reasoning. Regulators see the audit
              trail. Decision-makers see the confidence. This is the standard the industry needs —
              and the one Antaria is built on.
            </p>
          </div>
          {/* Mock score card */}
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ color: '#fff', fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, marginBottom: '0.25rem' }}>AX-7291</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span style={{ background: 'rgba(22,163,117,0.25)', color: '#16A375', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', fontFamily: 'var(--font-jetbrains-mono)' }}>
                0.84 (0.78–0.90) — High confidence
              </span>
            </div>
            {[{ label: 'Efficacy', v: 87 }, { label: 'Safety', v: 76 }, { label: 'ADMET', v: 82 }, { label: 'Developability', v: 71 }].map((p) => (
              <div key={p.label} style={{ marginBottom: '0.625rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{p.label}</span>
                  <span style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'var(--font-jetbrains-mono)' }}>{p.v}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${p.v}%`, background: p.v >= 80 ? '#16A375' : '#1E6BE6', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
            <p style={{ color: 'rgba(31,182,214,0.7)', fontSize: '0.7rem', marginTop: '1rem', fontFamily: 'var(--font-jetbrains-mono)' }}>
              Evidence: 47 ChEMBL assays · RDKit descriptors · Bayesian posterior
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#1FB6D6', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>For</p>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 600 }}>
              Built for the teams that cannot afford to guess.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {[
              { title: 'Small biotech', body: '2–20 person teams, pre-clinical to Phase II, who need to prioritise ruthlessly and defend every decision to investors and boards.' },
              { title: 'Translational research', body: 'Academic spinouts bridging discovery and clinical, who need regulatory-quality evidence trails from day one.' },
              { title: 'CROs and consultancies', body: 'Teams offering decision-intelligence reports as a service to pharma clients — Antaria is the engine under the hood.' },
            ].map((w) => (
              <div key={w.title} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '0.875rem', padding: '1.75rem' }}>
                <h3 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontWeight: 600, fontSize: '1.0625rem', marginBottom: '0.75rem' }}>{w.title}</h3>
                <p style={{ color: 'var(--slate)', fontSize: '0.9rem', lineHeight: 1.7 }}>{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '5rem 2rem', background: 'var(--bg)', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#1FB6D6', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>Atregenix</p>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, marginBottom: '1.5rem' }}>
            Founded on the conviction that better decisions save lives.
          </h2>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '0.875rem', padding: '1.75rem', display: 'inline-block', textAlign: 'left', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontFamily: 'var(--font-space-grotesk)' }}>F</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}>[Founder name]</div>
                <div style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>Founder &amp; CEO, Atregenix</div>
              </div>
            </div>
            <p style={{ color: 'var(--slate)', fontSize: '0.875rem', marginTop: '1rem', lineHeight: 1.7 }}>
              Background in [field]. Building the decision-intelligence platform drug discovery deserves.
            </p>
            <p style={{ color: 'var(--faint)', fontSize: '0.75rem', marginTop: '0.75rem', fontStyle: 'italic' }}>(Placeholder — update before investor meetings)</p>
          </div>
          <p style={{ color: 'var(--slate)', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            Antaria is in early access. We are working with a small number of partner teams.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #0A1B3D 0%, #0E2A55 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk)', color: '#fff', fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 600, marginBottom: '1rem' }}>
            Request early access.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '2rem', lineHeight: 1.7 }}>
            We are onboarding a small number of biotech and translational teams.
            Tell us about your pipeline.
          </p>
          <form action="mailto:hello@atregenix.com" method="get" style={{ display: 'flex', gap: '0.75rem', maxWidth: '440px', margin: '0 auto' }}>
            <input
              type="email" name="body" placeholder="your@email.com"
              style={{
                flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '0.9rem', outline: 'none',
              }}
            />
            <button type="submit" style={{
              background: '#1FB6D6', color: '#0A1B3D', fontWeight: 700,
              padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
              border: 'none', fontSize: '0.9rem', cursor: 'pointer',
            }}>
              Request access
            </button>
          </form>
          <p style={{ marginTop: '1.25rem' }}>
            <a href="mailto:hello@atregenix.com?subject=Book a call — Antaria" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', textDecoration: 'underline' }}>
              Or book a call
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--navy)', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StarMark size={16} />
          <span style={{ fontFamily: 'var(--font-space-grotesk)', color: '#fff', letterSpacing: '0.2em', fontSize: '0.8rem' }}>ANTARIA</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', textAlign: 'center' }}>
          Antaria is in early access. All data shown is sample data unless stated otherwise.
          <br />
          &copy; 2025 Atregenix Ltd. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <a href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textDecoration: 'none' }}>Terms</a>
        </div>
      </footer>
    </div>
  );
}
