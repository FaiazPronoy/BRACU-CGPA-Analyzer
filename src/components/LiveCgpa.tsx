import { useRef } from 'react';
import CgpaBar from './CgpaBar';
import { useStore } from '../store';

export default function LiveCgpa() {
  const store = useStore();
  const { totals: s, attempts, sheet } = store;
  const start = useRef({ attempts, sheet, cgpa: s.cgpa });
  if (sheet && sheet !== start.current.sheet) start.current = { attempts, sheet, cgpa: s.cgpa };

  return (
    <CgpaBar now={s.cgpa} before={start.current.cgpa} changed={attempts !== start.current.attempts}
      hint="Change a grade above and watch this update." undoLabel="Undo my changes"
      onUndo={() => store.setAll(start.current.attempts, start.current.sheet)} />
  );
}
