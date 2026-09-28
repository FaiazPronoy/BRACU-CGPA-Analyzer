import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import bn from './bn';
import en from './en';

export type Lang = 'en' | 'bn';
type Vars = Record<string, string | number>;

const dicts = { en, bn } as const;
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const TERM_BN: Record<string, string> = { Spring: 'স্প্রিং', Summer: 'সামার', Fall: 'ফল' };

function lookup(dict: unknown, key: string): string | undefined {
  const v = key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), dict);
  return typeof v === 'string' ? v : undefined;
}

function useLangValue() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem('hisab:lang') === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lookup(dicts[lang], 'meta.title') || 'Hisab';
    try {
      localStorage.setItem('hisab:lang', lang);
    } catch {
      /* fine */
    }
  }, [lang]);

  // numbers in the reader's digits; `places` fixes the decimals (a CGPA is always two)
  const num = useCallback(
    (n: number, places?: number) => {
      const s = places === undefined ? String(n) : n.toFixed(places);
      return lang === 'bn' ? s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : s;
    },
    [lang]
  );

  // t('boost.pick', { n: 3 }); a numeric n picks the `_one` form when there is one
  const t = useCallback(
    (key: string, vars?: Vars) => {
      let text: string | undefined;
      if (vars && vars.n === 1) text = lookup(dicts[lang], `${key}_one`);
      text ??= lookup(dicts[lang], key) ?? lookup(en, key) ?? key;
      if (!vars) return text;
      return text.replace(/\{(\w+)\}/g, (_, k) => {
        const v = vars[k];
        return typeof v === 'number' ? num(v) : v ?? '';
      });
    },
    [lang, num]
  );

  // "Spring 2025" in the reader's language
  const sem = useCallback(
    (name: string) => {
      if (lang === 'en' || !name) return name;
      const [term, year] = name.split(' ');
      return `${TERM_BN[term] ?? term} ${num(Number(year))}`;
    },
    [lang, num]
  );

  return useMemo(() => ({ lang, setLang, toggle: () => setLang((l) => (l === 'en' ? 'bn' : 'en')), t, num, sem }), [lang, t, num, sem]);
}

type LangValue = ReturnType<typeof useLangValue>;
const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const value = useLangValue();
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => {
  const v = useContext(LangContext);
  if (!v) throw new Error('useLang outside LangProvider');
  return v;
};
