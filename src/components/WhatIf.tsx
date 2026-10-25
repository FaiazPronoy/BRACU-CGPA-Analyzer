import { useState } from 'react';
import { Cross, Plus, Undo } from './bits';
import CgpaBar from './CgpaBar';
import { ALL_GRADES, Attempt, Grade, GRADE_POINTS, semesterIndex, totals } from '../engine/grades';
import { useStore } from '../store';

interface Row { key: string; code: string; title: string; credits: number; grade: Grade; dropped: boolean; added?: boolean }

const fromAttempts = (attempts: Attempt[]): Row[] =>
  [...totals(attempts).counted.values()]
    .sort((a, b) => semesterIndex(b.semester) - semesterIndex(a.semester) || a.code.localeCompare(b.code))
    .map((a) => ({ key: a.id, code: a.code, title: a.title || a.code, credits: a.credits, grade: a.grade, dropped: false }));

const cgpaOfRows = (rows: Row[]) =>
  totals(rows.filter((r) => !r.dropped).map((r) => ({ id: r.key, code: r.code || r.key, title: r.title, credits: r.credits, grade: r.grade, semester: 'Fall 2000' }))).cgpa;

const points = (g: string) => GRADE_POINTS[g as keyof typeof GRADE_POINTS];

export default function WhatIf() {
  const { valid, totals: s } = useStore();
  const [rows, setRows] = useState(() => fromAttempts(valid));
  const original = new Map(valid.map((a) => [a.id, a.grade]));
  const set = (key: string, patch: Partial<Row>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const changed = rows.filter((r) => r.added || r.dropped || r.grade !== original.get(r.key)).length;
  const shown = rows.filter((r) => {
    const was = original.get(r.key) ?? r.grade;
    return r.added || (points(was) !== undefined && points(was) < 4 && r.credits > 0);
  });
  const hidden = rows.length - shown.length;
  const reset = () => setRows(fromAttempts(valid));

  return (
    <section className="card whatif" aria-labelledby="wi">
      <div className="card-head">
        <div>
          <h2 id="wi">What if</h2>
          <p className="muted">Change any grade, leave a course out, or add the courses you are taking next. Nothing here is saved.</p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-line btn-sm"
            onClick={() => setRows([...rows, { key: `new${Date.now()}`, code: '', title: 'Future course', credits: 3, grade: 'A', dropped: false, added: true }])}>
            <Plus /> Add a future course
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={reset} disabled={!changed}><Undo /> Start over</button>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="muted">Every counted grade is already an A or A+. Add a future course to try next semester.</p>
      ) : (
        <ul className="whatif-list">
          {shown.map((r) => {
            const was = original.get(r.key);
            return (
              <li key={r.key} className={`whatif-row${r.dropped ? ' dropped' : ''}`}>
                {r.added ? (
                  <input className="field mono" aria-label="Course code" placeholder="Code" maxLength={6} value={r.code}
                    onChange={(e) => set(r.key, { code: e.target.value.toUpperCase() })} />
                ) : <span className="code">{r.code}</span>}
                <span className="whatif-title">
                  {r.title}
                  {was && was !== r.grade && <em>was {was}</em>}
                </span>
                {r.added ? (
                  <select className="field" aria-label={`Credits for ${r.code || 'the future course'}`} value={r.credits} onChange={(e) => set(r.key, { credits: Number(e.target.value) })}>
                    {[1, 1.5, 2, 3, 4].map((c) => <option key={c} value={c}>{c} cr</option>)}
                  </select>
                ) : <span className="muted small whatif-credits">{r.credits} cr</span>}
                <select className="field mono" aria-label={`Grade for ${r.code || 'the future course'}`} value={r.grade} disabled={r.dropped}
                  onChange={(e) => set(r.key, { grade: e.target.value as Grade })}>
                  {ALL_GRADES.map((g) => <option key={g}>{g}</option>)}
                </select>
                <button type="button" className="icon-btn" aria-pressed={r.dropped}
                  aria-label={`${r.added ? 'Remove' : r.dropped ? 'Put back' : 'Leave out'} ${r.code || 'the future course'}`}
                  onClick={() => (r.added ? setRows(rows.filter((x) => x.key !== r.key)) : set(r.key, { dropped: !r.dropped }))}>
                  {r.dropped ? <Undo /> : <Cross />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="muted small">
        {hidden > 0 && `${hidden} courses at A or A+ are left out of this list, but still count. `}
        {changed === 1 ? '1 change so far.' : `${changed} changes so far.`} Your real grades are untouched.
      </p>
      <CgpaBar now={cgpaOfRows(rows)} before={s.cgpa} changed={changed > 0}
        hint="Change a grade above and watch this update." undoLabel="Start over" onUndo={reset} />
    </section>
  );
}
