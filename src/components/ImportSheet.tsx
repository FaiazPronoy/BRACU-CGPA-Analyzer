import { useState } from 'react';
import { go } from '../App';
import SheetCheck from './SheetCheck';
import Upload from './Upload';
import type { ParsedSheet } from '../engine/gradesheet';
import { detectProgram } from '../engine/programs';
import { useStore } from '../store';

// drop zone, then the check, then the grades go in and the dashboard opens
export default function ImportSheet({ big = false }: { big?: boolean }) {
  const store = useStore();
  const [sheet, setSheet] = useState<{ parsed: ParsedSheet; file: string } | null>(null);
  return (
    <>
      <Upload big={big} onRead={(parsed, file) => setSheet({ parsed, file })} />
      <SheetCheck sheet={sheet?.parsed ?? null} file={sheet?.file ?? ''} replacing={store.valid.length > 0}
        onCancel={() => setSheet(null)}
        onUse={() => {
          if (!sheet) return;
          store.setAll(sheet.parsed.attempts, sheet.parsed.terms, detectProgram(sheet.parsed.program, sheet.file)?.code ?? null);
          setSheet(null);
          go('home');
        }} />
    </>
  );
}
