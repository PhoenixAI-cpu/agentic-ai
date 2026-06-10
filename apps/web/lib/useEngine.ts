'use client';

import { useEffect, useState } from 'react';
import { logEvent } from '@/lib/ledger';

// Module-level flag: log the engine scoring event at most once per session.
let engineEventLogged = false;

export interface EnginePropertyScore {
  mean: number;
  ci_low: number;
  ci_high: number;
  ci_width: number;
  evidence: Array<{
    rule: string;
    value: number;
    satisfaction: number;
    weight: number;
    contribution: number;
    direction: string;
    rationale: string;
  }>;
}

export interface EngineCandidate {
  id: string;
  name: string;
  stage: string | null;
  smiles: string;
  error: string | null;
  confidence_label?: 'High' | 'Medium' | 'Low';
  overall?: EnginePropertyScore | null;
  properties?: {
    efficacy: EnginePropertyScore;
    safety: EnginePropertyScore;
    admet: EnginePropertyScore;
    developability: EnginePropertyScore;
  };
  descriptors?: Record<string, number | string>;
}

interface UseEngineResult {
  candidates: EngineCandidate[] | null;
  isLive: boolean;
  loading: boolean;
}

/**
 * Fetches the scored sample candidate set from the engine via the proxy.
 * Falls back to null (so callers can render static samples) on timeout,
 * network error, or non-OK response. 3s timeout keeps the demo snappy offline.
 */
export function useEngineCandidates(): UseEngineResult {
  const [candidates, setCandidates] = useState<EngineCandidate[] | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    (async () => {
      try {
        const res = await fetch('/api/engine/candidates/sample', {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        const list: EngineCandidate[] = data?.candidates ?? [];
        const usable = list.filter((c) => c.overall && !c.error);
        if (!cancelled && usable.length > 0) {
          setCandidates(usable);
          setIsLive(true);
          if (!engineEventLogged) {
            engineEventLogged = true;
            void logEvent({
              actor: 'Engine v0',
              action: 'Scored candidate set',
              subject: 'Sample candidates',
              detail: { count: usable.length },
              confidence: 'Bayesian 95% CI',
            });
          }
        }
      } catch {
        // Silent fallback — callers keep their static sample data.
      } finally {
        clearTimeout(timer);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return { candidates, isLive, loading };
}
