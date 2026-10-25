import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { FileIcon, Lock, Upload as UploadIcon } from './bits';
import { ParsedSheet, readGradeSheet } from '../engine/gradesheet';

export default function Upload({ onRead, big = false }: { onRead: (sheet: ParsedSheet, file: string) => void; big?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  const read = async (file?: File) => {
    if (!file) return;
    setError('');
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return setError('That is not a PDF. Download the grade sheet from Connect and use that file.');
    setBusy(true);
    try {
      const sheet = await readGradeSheet(file);
      if (!sheet.attempts.length) setError('No courses found in that file. Is it the Grade Sheet from Connect? A scanned transcript cannot be read.');
      else onRead(sheet, file.name);
    } catch {
      setError('Could not read that PDF. Download it again from Connect and try once more.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <div className={`drop${big ? ' big' : ''}${over ? ' over' : ''}`}
        onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); read(e.dataTransfer.files[0]); }}>
        <span className="drop-icon"><FileIcon /></span>
        <div className="drop-text">
          <p className="drop-title">{busy ? 'Reading your grade sheet…' : 'Drop your grade sheet here'}</p>
          <p className="muted small">The PDF from Connect: <b>Grade Sheet</b>, then <b>Download</b>.</p>
        </div>
        <input ref={input} type="file" accept="application/pdf,.pdf" hidden tabIndex={-1} onChange={(e: ChangeEvent<HTMLInputElement>) => read(e.target.files?.[0])} />
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}><UploadIcon /> Choose PDF</button>
      </div>
      <p className="muted small privacy"><Lock /> Read on your device. The file is never uploaded anywhere.</p>
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}
