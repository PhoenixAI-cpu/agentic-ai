'use client';

import { LedgerEvent } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';

const STORAGE_KEY = 'antaria_ledger';
const MAX_LOCAL_ENTRIES = 200;

function readLocal(): LedgerEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LedgerEvent[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(events: LedgerEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(events.slice(0, MAX_LOCAL_ENTRIES))
    );
  } catch {
    // Storage full or unavailable — ledger degrades silently.
  }
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface LogEventInput {
  actor: string;
  action: string;
  subject?: string;
  detail?: Record<string, unknown>;
  reasoning?: string;
  confidence?: string;
}

/**
 * Appends an event to the Evidence Ledger. Always written to localStorage
 * (capped at 200 entries); additionally persisted to Supabase if configured.
 */
export async function logEvent(event: LogEventInput): Promise<LedgerEvent> {
  const entry: LedgerEvent = {
    id: makeId(),
    occurredAt: new Date().toISOString(),
    ...event,
  };

  writeLocal([entry, ...readLocal()]);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('ledger_events').insert({
        id: entry.id,
        occurred_at: entry.occurredAt,
        actor: entry.actor,
        action: entry.action,
        subject: entry.subject ?? null,
        detail: entry.detail ?? null,
        reasoning: entry.reasoning ?? null,
        confidence: entry.confidence ?? null,
      });
    } catch {
      // Remote write failed — the local copy still stands.
    }
  }

  return entry;
}

/**
 * Returns merged ledger events from Supabase (if configured) and
 * localStorage, de-duplicated by id and sorted newest first.
 */
export async function getEvents(): Promise<LedgerEvent[]> {
  const local = readLocal();
  let remote: LedgerEvent[] = [];

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('ledger_events')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(200);
      remote = (data ?? []).map((row) => ({
        id: row.id,
        occurredAt: row.occurred_at,
        actor: row.actor,
        action: row.action,
        subject: row.subject ?? undefined,
        detail: row.detail ?? undefined,
        reasoning: row.reasoning ?? undefined,
        confidence: row.confidence ?? undefined,
      }));
    } catch {
      // Fall back to local-only.
    }
  }

  const byId = new Map<string, LedgerEvent>();
  for (const event of [...remote, ...local]) {
    if (!byId.has(event.id)) byId.set(event.id, event);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}
