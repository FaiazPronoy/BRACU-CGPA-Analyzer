import { useRef } from 'react';
import { Undo } from './bits';
import { signedValue, two } from '../format';
import { useStore } from '../store';

// pinned to the bottom of My courses: the CGPA as it stands after every edit,
// next to what it was when the page opened
export default function LiveCgpa() {
  const store = useStore();
  const { totals: s, attempts, sheet } = store;
  // what things looked like on arrival, so a change can be shown and undone
  const start = useRef({ attempts, sheet, cgpa: s.cgpa });
  // a newly uploaded sheet is a fresh start, not an edit to undo
  if (sheet && sheet !== start.current.sheet) start.current = { attempts, sheet, cgpa: s.cgpa };
  const before = start.current.cgpa;
  const changed = attempts !== start.current.attempts;
  const delta = before !== null && s.cgpa !== null ? s.cgpa - before : 0;

  return (
    <div className="live" role="status" aria-live="polite">
      <div className="live-now">
        <span>Your CGPA</span>
        {/* the key restarts the flash every time the number changes */}
        <b key={s.cgpa ?? 'none'} className="live-number">{s.cgpa !== null ? two(s.cgpa) : 'n/a'}</b>
      </div>
      {changed && before !== null && s.cgpa !== null ? (
        <>
          <p className="live-was">
            was <b className="mono">{two(before)}</b>
            {Math.abs(delta) >= 0.005 && <span className={`pill ${delta > 0 ? 'good' : 'pen'}`}>{signedValue(delta)}</span>}
          </p>
          <button type="button" className="btn btn-line btn-sm" aria-label="Undo my changes" onClick={() => store.setAll(start.current.attempts, start.current.sheet)}>
            <Undo /> <span className="hide-sm">Undo my changes</span><span className="show-sm">Undo</span>
          </button>
        </>
      ) : (
        <p className="live-was">Change a grade below and watch this update.</p>
      )}
    </div>
  );
}
