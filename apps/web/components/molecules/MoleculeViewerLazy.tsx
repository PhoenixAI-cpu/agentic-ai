'use client';

import dynamic from 'next/dynamic';

export const MoleculeViewerLazy = dynamic(
  () => import('@/components/molecules/MoleculeViewer3D').then((m) => m.MoleculeViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-lg bg-gray-100" />
    ),
  }
);
