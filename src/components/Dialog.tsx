import { ReactNode, useEffect, useRef } from 'react';

export default function Dialog({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`dialog${wide ? ' wide' : ''}`} aria-labelledby="dialog-title" onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <div className="dialog-body">
          <h2 id="dialog-title">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
