import dynamic from 'next/dynamic';

const MoleculeViewer3D = dynamic(
  () => import('@/components/molecules/MoleculeViewer3D').then((m) => m.MoleculeViewer3D),
  {
    ssr: false,
    loading: () => <div className="w-[400px] h-[400px] bg-gray-100 rounded-xl animate-pulse" />,
  }
);

export const metadata = {
  title: 'Molecular Explorer — Antaria',
};

export default function MoleculesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1
        className="text-2xl font-semibold mb-2"
        style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--navy)' }}
      >
        Molecular Explorer
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--slate)' }}>
        Interactive 3D structure viewer for drug candidates.
      </p>

      <div className="flex flex-col items-center gap-6">
        <div
          className="rounded-xl border border-[var(--line)] p-6 w-full max-w-xl flex flex-col items-center gap-6"
          style={{ background: 'var(--panel)' }}
        >
          <MoleculeViewer3D width={400} height={400} className="rounded-xl overflow-hidden" />

          <div className="text-center">
            <h2
              className="text-xl font-semibold mb-1"
              style={{ color: 'var(--navy)', fontFamily: 'var(--font-space-grotesk)' }}
            >
              AX-7291
            </h2>
            <p className="text-sm mb-0.5" style={{ color: 'var(--slate)' }}>
              Formula:{' '}
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--ink)' }}>
                C₈H₁₀N₄O₂
              </span>{' '}
              <span className="text-xs" style={{ color: 'var(--faint)' }}>
                (sample)
              </span>
            </p>
            <p className="text-sm" style={{ color: 'var(--slate)' }}>
              Molecular weight:{' '}
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--ink)' }}>
                194.19 g/mol
              </span>{' '}
              <span className="text-xs" style={{ color: 'var(--faint)' }}>
                (sample)
              </span>
            </p>
          </div>
        </div>

        <p
          className="text-xs text-center max-w-lg"
          style={{ color: 'var(--faint)', fontFamily: 'var(--font-inter)' }}
        >
          Structure shown is a sample. In production, Antaria retrieves 3D coordinates from
          PDB/AlphaFold or generates them via RDKit conformer generation.
        </p>
      </div>
    </div>
  );
}
