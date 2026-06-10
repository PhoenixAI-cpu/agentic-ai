interface StatCard {
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
}

const stats: StatCard[] = [
  { label: 'Active Projects', value: '12', delta: '+2 this week', deltaPositive: true },
  { label: 'Molecules Analysed', value: '4,847', delta: '+234 this month', deltaPositive: true },
  { label: 'Predictions Run', value: '1,203', delta: '+89 today', deltaPositive: true },
  { label: 'Clinical Trials Tracked', value: '328', delta: '+14 this week', deltaPositive: true },
];

export default function StatRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl p-4 border border-[var(--line)]"
          style={{ background: 'var(--panel)' }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'var(--slate)', fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {stat.label}
          </p>
          <p
            className="text-3xl font-semibold leading-none"
            style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
          >
            {stat.value}
          </p>
          <span
            className="inline-block mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{
              background: stat.deltaPositive ? '#E8F8F3' : '#FEF2F2',
              color: stat.deltaPositive ? 'var(--green)' : 'var(--red)',
              fontFamily: 'var(--font-inter)',
            }}
          >
            {stat.delta}
          </span>
          <p className="text-[10px] mt-1" style={{ color: 'var(--faint)' }}>
            Sample data
          </p>
        </div>
      ))}
    </div>
  );
}
