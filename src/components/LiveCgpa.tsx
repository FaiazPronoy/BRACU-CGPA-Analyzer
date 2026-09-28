import { useRef } from 'react';
import CgpaBar from './CgpaBar';
import { useStore } from '../store';

// the bar on My courses: the saved grades now, against how they were when the page opened
export default function LiveCgpa() {
  const store = useStore();
  const { totals: s, attempts, sheet } = store;
  // what things looked like on arrival, so a change can be shown and undone
  const start = useRef({ attempts, sheet, cgpa: s.cgpa });
  // a newly uploaded sheet is a fresh start, not an edit to undo
  if (sheet && sheet !== start.current.sheet) start.current = { attempts, sheet, cgpa: s.cgpa };

  return (
    <CgpaBar now={s.cgpa} before={start.current.cgpa} changed={attempts !== start.current.attempts}
      hint="Change a grade above and watch this update." undoLabel="Undo my changes"
      onUndo={() => store.setAll(start.current.attempts, start.current.sheet)} />
  );
}
