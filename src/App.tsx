import { useEffect, useState } from 'react';
import { Circled, Globe, Moon, Sun } from './components/bits';
import { honourOf, levelOf, standingOf } from './engine/grades';
import { useLang } from './i18n';
import Boost from './pages/Boost';
import Grades from './pages/Grades';
import Overview from './pages/Overview';
import Plan from './pages/Plan';
import Rules from './pages/Rules';
import { useStore } from './store';

export const PAGES = ['grades', 'overview', 'boost', 'plan', 'rules'] as const;
export type Page = (typeof PAGES)[number];

// plain hash routes (#/boost), so the built site works on any static host
function usePage(hasData: boolean): Page {
  const read = (): Page => {
    const p = window.location.hash.replace(/^#\/?/, '') as Page;
    return PAGES.includes(p) ? p : hasData ? 'overview' : 'grades';
  };
  const [page, setPage] = useState<Page>(read);
  useEffect(() => {
    const on = () => {
      setPage(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  });
  return page;
}

export const go = (page: Page) => {
  window.location.hash = `/${page}`;
};

function useDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('hisab:theme', dark ? 'dark' : 'light');
    } catch {
      /* fine */
    }
  }, [dark]);
  return [dark, () => setDark((d) => !d)] as const;
}

function Slip() {
  const { t, num } = useLang();
  const { totals: s, rows, attempts, programInfo } = useStore();
  if (!attempts.length || s.cgpa === null) return null;
  const standing = standingOf(rows, programInfo?.probation);
  const honour = honourOf(s.cgpa);
  return (
    <section className="slip" aria-label={t('slip.label')}>
      <div className="cgpa">
        <b>
          <Circled>{num(s.cgpa, 2)}</Circled>
        </b>
        <span>{t('slip.cgpa')}</span>
      </div>
      <div>
        <b>{num(s.earned)}</b>
        <span>{t('slip.earned')}</span>
      </div>
      <div>
        <b>{num(s.attempted)}</b>
        <span>{t('slip.attempted')}</span>
      </div>
      <div>
        <b style={{ fontSize: '1.1rem', fontFamily: 'var(--display)' }}>{t(`level.${levelOf(s.earned)}`)}</b>
        <span>{t('slip.level')}</span>
      </div>
      <div>
        <b style={{ fontSize: '1.1rem', fontFamily: 'var(--display)' }}>
          {standing && standing.status !== 'good'
            ? <span className="tag pen">{t(`standing.${standing.status}`)}</span>
            : <span className="tag good">{t('standing.good')}</span>}
        </b>
        <span>{honour ? t(`honour.${honour}`) : t('slip.standing')}</span>
      </div>
    </section>
  );
}

export default function App() {
  const { t, lang, toggle } = useLang();
  const { attempts } = useStore();
  const [dark, toggleDark] = useDark();
  const page = usePage(attempts.length > 0);

  return (
    <>
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('nav.skip')}</a>
      <header className="top wrap">
        <div className="row spread">
          <a href="#/" className="brand" aria-label={t('brand.home')}>
            <img className="brand-mark" src="./favicon.svg" alt="" width={44} height={44} />
            <span>
              <span className="brand-name">{t('brand.name')}</span>
              <span className="brand-sub">{t('brand.sub')}</span>
            </span>
          </a>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="tool-btn" onClick={toggle} lang={lang === 'en' ? 'bn' : 'en'} aria-label={t('nav.otherLangLabel')}>
              <Globe /> {t('nav.otherLang')}
            </button>
            <button type="button" className="tool-btn" onClick={toggleDark} aria-label={dark ? t('nav.toLight') : t('nav.toDark')}>
              {dark ? <Sun /> : <Moon />}
            </button>
          </div>
        </div>

        <nav className="tabs" aria-label={t('nav.label')}>
          {PAGES.map((p, i) => (
            <a key={p} href={`#/${p}`} className="tab" aria-current={page === p ? 'page' : undefined}>
              <span className="num" aria-hidden="true">{i + 1}</span>
              <span className="long">{t(`nav.${p}`)}</span>
              <span className="short">{t(`nav.short.${p}`)}</span>
            </a>
          ))}
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="wrap" style={{ outline: 'none' }}>
        <div className="sheet">
          {page !== 'rules' && page !== 'grades' && <Slip />}
          {page === 'grades' && <Grades />}
          {page === 'overview' && <Overview />}
          {page === 'boost' && <Boost />}
          {page === 'plan' && <Plan />}
          {page === 'rules' && <Rules />}
        </div>
      </main>

      <footer className="foot wrap">
        <p>{t('foot.private')}</p>
        <p style={{ marginTop: 6 }}>
          {t('foot.source')}{' '}
          <a href="https://www.bracu.ac.bd/academics/policies-and-procedures" target="_blank" rel="noreferrer">bracu.ac.bd</a>
          {' '}{t('foot.checked')}
        </p>
        <p style={{ marginTop: 6 }}>{t('foot.unofficial')}</p>
      </footer>
    </>
  );
}
