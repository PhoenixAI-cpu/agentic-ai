export const metadata = {
  title: 'Ledger — Antaria',
};

export default function LedgerPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1
        className="text-2xl font-semibold mb-2"
        style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)' }}
      >
        Ledger
      </h1>
      <p className="text-sm" style={{ color: 'var(--slate)' }}>
        Coming soon — this section is under active development.
      </p>
    </div>
  );
}
