import { ReactNode } from 'react';

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
export const Printer = icon(<><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>);
export const Arrow = icon(<><path d="M5 12h14M13 6l6 6-6 6" /></>);
export const ArrowDown = icon(<><path d="M12 5v14M6 13l6 6 6-6" /></>);
export const Gauge = icon(<><path d="M4 15a8 8 0 1 1 16 0" /><path d="m12 15 4-5" /></>);
export const Rise = icon(<><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>);
export const Calendar = icon(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>);
export const Rows = icon(<><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>);
export const Book = icon(<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></>);
export const Restart = icon(<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>);
export const Target = icon(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>);
export const Spark = icon(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6 6 2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>);
export const Undo = icon(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>);

