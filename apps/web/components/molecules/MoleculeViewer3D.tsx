'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

const ATOM_COLORS: Record<string, string> = {
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  H: '#FFFFFF',
  S: '#FFFF30',
};

const CAFFEINE_ATOMS = [
  { id: 0, element: 'C', position: [0.0, 0.0, 0.0] as [number, number, number] },
  { id: 1, element: 'C', position: [1.4, 0.0, 0.0] as [number, number, number] },
  { id: 2, element: 'N', position: [2.1, 1.2, 0.0] as [number, number, number] },
  { id: 3, element: 'C', position: [1.4, 2.3, 0.0] as [number, number, number] },
  { id: 4, element: 'N', position: [0.0, 2.3, 0.0] as [number, number, number] },
  { id: 5, element: 'C', position: [-0.7, 1.2, 0.0] as [number, number, number] },
  { id: 6, element: 'N', position: [-2.1, 1.2, 0.0] as [number, number, number] },
  { id: 7, element: 'C', position: [2.1, 3.6, 0.0] as [number, number, number] },
  { id: 8, element: 'O', position: [1.4, 4.7, 0.0] as [number, number, number] },
  { id: 9, element: 'N', position: [3.5, 3.6, 0.0] as [number, number, number] },
  { id: 10, element: 'C', position: [4.2, 2.3, 0.0] as [number, number, number] },
  { id: 11, element: 'O', position: [5.6, 2.3, 0.0] as [number, number, number] },
  { id: 12, element: 'C', position: [-0.7, 3.6, 0.0] as [number, number, number] },
  { id: 13, element: 'O', position: [-1.4, 4.7, 0.0] as [number, number, number] },
];

const CAFFEINE_BONDS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
  [5, 6], [3, 7], [7, 8], [7, 9], [9, 10], [10, 11],
  [4, 12], [12, 13], [2, 10], [9, 3],
];

function Atom({ position, element }: { position: [number, number, number]; element: string }) {
  const color = ATOM_COLORS[element] ?? '#909090';
  const radius = element === 'H' ? 0.12 : element === 'C' ? 0.2 : 0.22;
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshPhongMaterial color={color} shininess={80} />
    </mesh>
  );
}

function Bond({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const midpoint = startVec.clone().add(endVec).multiplyScalar(0.5);
  const length = startVec.distanceTo(endVec);
  const direction = endVec.clone().sub(startVec).normalize();
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  return (
    <mesh position={midpoint.toArray() as [number, number, number]} quaternion={quaternion}>
      <cylinderGeometry args={[0.06, 0.06, length, 8]} />
      <meshPhongMaterial color="#cccccc" shininess={40} />
    </mesh>
  );
}

function MoleculeGroup() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.3;
  });
  return (
    <group ref={groupRef}>
      {CAFFEINE_ATOMS.map((a) => (
        <Atom key={a.id} position={a.position} element={a.element} />
      ))}
      {CAFFEINE_BONDS.map(([i, j], idx) => (
        <Bond key={idx} start={CAFFEINE_ATOMS[i].position} end={CAFFEINE_ATOMS[j].position} />
      ))}
    </group>
  );
}

interface MoleculeViewer3DProps {
  width?: number;
  height?: number;
  className?: string;
}

export function MoleculeViewer3D({ width = 300, height = 300, className }: MoleculeViewer3DProps) {
  return (
    <div style={{ width, height }} className={className}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[0, -3, 3]} intensity={0.3} />
        <MoleculeGroup />
        <OrbitControls enablePan={false} enableZoom={true} />
      </Canvas>
    </div>
  );
}
