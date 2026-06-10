export default function GreetingSection() {
  return (
    <div className="mb-6">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)' }}
      >
        Good morning, Sarah.
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--slate)' }}>
        Your scientific copilot, Ana, is ready to help.
      </p>
    </div>
  );
}
