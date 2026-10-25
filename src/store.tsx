import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Attempt, nextSemester, semesterIndex, timeline, totals } from './engine/grades';
import type { SheetTerm } from './engine/gradesheet';
import { programByCode } from './engine/programs';

const KEY = 'cgpa-analyzer:v1';

interface Saved {
  attempts: Attempt[];
  sheet: SheetTerm[] | null;
  next: string | null;
  program: string | null;
  total: number | null;
}

const empty: Saved = { attempts: [], sheet: null, next: null, program: null, total: null };

const load = (): Saved => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && Array.isArray(raw.attempts)) return { ...empty, ...raw };
  } catch {
  }
  return empty;
};

function useStoreValue() {
  const [saved, setSaved] = useState<Saved>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
    }
  }, [saved]);

  const derived = useMemo(() => {
    const valid = saved.attempts.filter((a) => /^[A-Z]{3}\d{3}$/.test(a.code) && semesterIndex(a.semester) >= 0);
    const rows = timeline(valid);
    const t = totals(valid);
    const named = [...new Set(saved.attempts.map((a) => a.semester))].filter((n) => semesterIndex(n) >= 0).sort((x, y) => semesterIndex(x) - semesterIndex(y));
    const latest = named.length ? named[named.length - 1] : null;
    const suggestedNext = latest ? nextSemester(latest) : null;
    const next = saved.next && latest && semesterIndex(saved.next) > semesterIndex(latest) ? saved.next : suggestedNext;
    const program = programByCode(saved.program);
    const needed = saved.total ?? program?.credits ?? null;
    return { valid, rows, totals: t, latest, next, programInfo: program, needed };
  }, [saved]);

  return {
    ...saved,
    ...derived,
    setAll: (attempts: Attempt[], sheet: SheetTerm[] | null = null, program?: string | null) =>
      setSaved((s) => ({ ...s, attempts, sheet, ...(program !== undefined ? { program, total: null } : {}) })),
    setProgram: (program: string | null) => setSaved((s) => ({ ...s, program, total: null })),
    setTotal: (total: number | null) => setSaved((s) => ({ ...s, total })),
    update: (id: string, patch: Partial<Attempt>) =>
      setSaved((s) => ({ ...s, sheet: null, attempts: s.attempts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
    add: (a: Attempt) => setSaved((s) => ({ ...s, sheet: null, attempts: [...s.attempts, a] })),
    remove: (id: string) => setSaved((s) => ({ ...s, sheet: null, attempts: s.attempts.filter((a) => a.id !== id) })),
    removeSemester: (name: string) => setSaved((s) => ({ ...s, sheet: null, attempts: s.attempts.filter((a) => a.semester !== name) })),
    setNext: (next: string) => setSaved((s) => ({ ...s, next })),
    clear: () => setSaved(empty),
  };
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
};
