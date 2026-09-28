import { Undo } from './bits';
import { signedValue, two } from '../format';

// pinned to the bottom while grades are being changed: the CGPA now, next to
// what it was, so every edit shows its effect without scrolling back up
export default function CgpaBar({ now, before, changed, hint, undoLabel, onUndo }: {
  now: number | null;
  before: number | null;
  changed: boolean;
  hint: string;
  undoLabel: string;
  onUndo: () => void;
}) {
  const delta = before !== null && now !== null ? now - before : 0;
  return (
    <div className="live" role="status" aria-live="polite">
      <div className="live-now">
        <span>Your CGPA</span>
        {/* the key restarts the flash every time the number changes */}
        <b key={now ?? 'none'} className="live-number">{now !== null ? two(now) : 'n/a'}</b>
      </div>
      {changed && before !== null && now !== null ? (
        <>
          <p className="live-was">
            was <b className="mono">{two(before)}</b>
            {Math.abs(delta) >= 0.005 && <span className={`pill ${delta > 0 ? 'good' : 'pen'}`}>{signedValue(delta)}</span>}
          </p>
          <button type="button" className="btn btn-line btn-sm" aria-label={undoLabel} onClick={onUndo}>
            <Undo /> <span className="hide-sm">{undoLabel}</span><span className="show-sm">Undo</span>
          </button>
        </>
      ) : (
        <p className="live-was">{hint}</p>
      )}
    </div>
  );
}
