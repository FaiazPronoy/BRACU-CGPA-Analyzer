import { useState } from 'react';
import { Check, Warn } from './bits';
import Dialog from './Dialog';
import { checkSheet, FIGURES, ParsedSheet } from '../engine/gradesheet';
import { detectProgram } from '../engine/programs';
import { two } from '../format';

const LABEL: Record<string, string> = {
  attempted: 'credits attempted', earned: 'credits earned', gpa: 'GPA', cumAttempted: 'total attempted', cumEarned: 'total earned', cgpa: 'CGPA',
};

// after an upload: what was found, and whether every semester matches the sheet
export default function SheetCheck({ sheet, file, replacing, onUse, onCancel }: {
  sheet: ParsedSheet | null; file: string; replacing: boolean; onUse: () => void; onCancel: () => void;
}) {
  const [details, setDetails] = useState(false);
  if (!sheet) return null;
  const checks = checkSheet(sheet);
  const wrong = checks.filter((c) => !c.ok);
  const ok = checks.length > 0 && !wrong.length;
  const last = sheet.terms[sheet.terms.length - 1];
  const program = detectProgram(sheet.program, file);
  const show = (k: string, v: number) => (k === 'gpa' || k === 'cgpa' ? two(v) : String(v));

  return (
    <Dialog open onClose={onCancel} title={ok ? 'Your grade sheet checks out' : 'Your grade sheet, read'} wide>
      <p className="muted">{sheet.attempts.length} courses across {checks.length} semesters{program ? `, ${program.name}` : ''}.</p>
      <div className={`notice ${ok ? 'good' : 'warn'}`}>
        {ok ? <Check /> : <Warn />}
        <div>
          <p><b>{ok ? `All ${checks.length} semesters match your sheet. CGPA ${two(last.cgpa)}.` : checks.length ? `${wrong.length} of ${checks.length} semesters do not match your sheet.` : 'We found the courses, but no semester totals to check them against.'}</b></p>
          <p className="small">{ok ? 'Every GPA, CGPA and credit total we work out is exactly what your sheet prints.' : 'A row was probably misread. You can still use it and fix the course under My courses, but do not trust the CGPA until it matches.'}</p>
          {wrong.map((c) => (
            <p key={c.semester} className="small"><b>{c.semester}:</b> {FIGURES.filter((k) => Math.abs(c.figures[k][0] - c.figures[k][1]) >= 0.001).map((k) => `${LABEL[k]} ${show(k, c.figures[k][0])} here, ${show(k, c.figures[k][1])} on the sheet`).join('; ')}</p>
          ))}
        </div>
      </div>
      <button type="button" className="link-btn small" aria-expanded={details} onClick={() => setDetails((d) => !d)}>{details ? 'Hide' : 'See'} the semester by semester check</button>
      {details && (
        <div className="table-wrap">
          <table className="plain">
            <thead><tr><th scope="col">Semester</th><th scope="col" className="num">GPA</th><th scope="col" className="num">CGPA</th><th scope="col" className="num">Earned</th><th scope="col"><span className="sr-only">Result</span></th></tr></thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.semester}>
                  <th scope="row">{c.semester}</th>
                  <td className="num">{two(c.figures.gpa[1])}</td>
                  <td className="num">{two(c.figures.cgpa[1])}</td>
                  <td className="num">{c.figures.cumEarned[1]}</td>
                  <td>{c.ok ? <span className="pill good">matches</span> : <span className="pill warn">differs</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {sheet.guessed.length > 0 && <p className="muted small">An F or an I shows no credits on the sheet, so these were worked out from the semester totals: {sheet.guessed.join(', ')}.</p>}
      {replacing && <p className="muted small">This replaces the grades you have here now.</p>}
      <div className="dialog-actions">
        <button type="button" className="btn btn-quiet" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={onUse}>Use these grades</button>
      </div>
    </Dialog>
  );
}
