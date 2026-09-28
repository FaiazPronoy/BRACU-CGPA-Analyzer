import { ReactNode } from 'react';

// a few line icons, drawn for this site so it does not look like every other one
const icon = (d: ReactNode) =>
  function Icon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {d}
      </svg>
    );
  };

export const Upload = icon(<><path d="M12 15V4" /><path d="m7 9 5-5 5 5" /><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></>);
export const FileIcon = icon(<><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>);
export const Plus = icon(<><path d="M12 5v14M5 12h14" /></>);
export const Cross = icon(<><path d="M6 6l12 12M18 6 6 18" /></>);
export const Trash = icon(<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>);
export const Check = icon(<><path d="m5 12 5 5 9-10" /></>);
export const Warn = icon(<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17.5v.01" /></>);
export const Lock = icon(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const Moon = icon(<><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></>);
export const Sun = icon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const Globe = icon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
export const Undo = icon(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>);
export const Printer = icon(<><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>);
export const Arrow = icon(<><path d="M5 12h14M13 6l6 6-6 6" /></>);
export const Spark = icon(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6 6 2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>);

// a loose, hand-drawn ring, the way a teacher circles a mark
export function Circled({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <span className="circled" aria-label={label}>
      {children}
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
        <path d="M8 26 C6 10 40 4 62 6 C86 8 98 18 94 32 C90 46 50 48 28 45 C10 42 4 34 10 20 C14 12 24 9 34 8"
          fill="none" stroke="var(--pen)" strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="hand" aria-hidden="true">?</p>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

export const gradeClass = (g: string) => `grade${g === 'F' ? ' f' : ''}`;
