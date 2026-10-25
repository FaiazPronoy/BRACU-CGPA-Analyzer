import { useState } from 'react';
import { go } from '../App';
import { Restart } from './bits';
import Dialog from './Dialog';
import { useStore } from '../store';

export default function StartOver({ compact = false }: { compact?: boolean }) {
  const { clear, valid } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={compact ? 'tool-btn' : 'btn btn-quiet danger'} onClick={() => setOpen(true)} aria-label={compact ? 'Start over with a new grade sheet' : undefined} title={compact ? 'Start over' : undefined}>
        <Restart /> {compact ? <span className="hide-sm">Start over</span> : 'Start over'}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Start over?">
        <p>This removes all {valid.length} courses from this browser, so you can upload a new grade sheet or begin again. Nothing else is affected.</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-quiet" onClick={() => setOpen(false)}>Keep my grades</button>
          <button type="button" className="btn btn-danger" onClick={() => { clear(); setOpen(false); go('home'); }}>Yes, start over</button>
        </div>
      </Dialog>
    </>
  );
}
