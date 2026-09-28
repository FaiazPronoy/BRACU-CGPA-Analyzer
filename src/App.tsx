import { ReactNode, useEffect, useState } from 'react';
import { Book, Calendar, Gauge, Moon, Rise, Rows, Sun } from './components/bits';
import StartOver from './components/StartOver';
import Courses from './pages/Courses';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Repeat from './pages/Repeat';
import Rules from './pages/Rules';
import { useStore } from './store';

export const PAGES = ['home', 'repeat', 'plan', 'courses', 'rules'] as const;
export type Page = (typeof PAGES)[number];
// the old addresses still work
const OLD: Record<string, Page> = { overview: 'home', boost: 'repeat', raise: 'repeat', grades: 'courses' };

// plain hash routes (#/repeat), so the built site works on any static host
function usePage(): Page {
  const read = (): Page => {
    const p = window.location.hash.replace(/^#\/?/, '');
    return (PAGES as readonly string[]).includes(p) ? (p as Page) : OLD[p] ?? 'home';
  };
  const [page, setPage] = useState<Page>(read);
  useEffect(() => {
    const on = () => {
      setPage(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return page;
}

export const go = (page: Page) => {
  window.location.hash = page === 'home' ? '/' : `/${page}`;
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

// the four things people come to do, in the order they usually do them
const NAV: { page: Page; label: string; icon: ReactNode }[] = [
  { page: 'home', label: 'My CGPA', icon: <Gauge /> },
  { page: 'repeat', label: 'Repeat or retake', icon: <Rise /> },
  { page: 'plan', label: 'Plan ahead', icon: <Calendar /> },
  { page: 'courses', label: 'My courses', icon: <Rows /> },
];

export default function App() {
  const page = usePage();
  const [dark, toggleDark] = useDark();
  const { valid } = useStore();
  const has = valid.length > 0;

  return (
    <>
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to the calculator</a>
      <header className="bar">
        <div className="wrap bar-inner">
          <a href="#/" className="brand" aria-label="Hisab, home">
            <img src="./favicon.svg" alt="" width={36} height={36} />
            <span className="brand-name">Hisab</span>
            <span className="brand-sub">BRACU CGPA calculator</span>
          </a>
          {has && (
            <nav className="nav" aria-label="Sections">
              {NAV.map((n) => (
                <a key={n.page} href={n.page === 'home' ? '#/' : `#/${n.page}`} className="nav-link" aria-current={page === n.page ? 'page' : undefined}>
                  {n.icon}<span>{n.label}</span>
                </a>
              ))}
            </nav>
          )}
          <div className="bar-tools">
            <a href="#/rules" className="tool-btn" aria-current={page === 'rules' ? 'page' : undefined}><Book /><span className="hide-sm">BRACU rules</span></a>
            {has && <StartOver compact />}
            <button type="button" className="tool-btn" onClick={toggleDark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun /> : <Moon />}</button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="wrap main">
        {page === 'home' && <Home />}
        {page === 'repeat' && <Repeat />}
        {page === 'plan' && <Plan />}
        {page === 'courses' && <Courses />}
        {page === 'rules' && <Rules />}
      </main>

      <footer className="wrap foot">
        <p>Everything stays in this browser: no account, no server, nothing uploaded.</p>
        <p>
          Rules from <a href="https://www.bracu.ac.bd/academics/policies-and-procedures" target="_blank" rel="noreferrer">bracu.ac.bd</a> (read September 2026), checked against real grade sheets.
          An independent student tool, not an official BRAC University service.
        </p>
      </footer>
    </>
  );
}
