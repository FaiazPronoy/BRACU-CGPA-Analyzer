import { useMemo, useState } from 'react';
import { Check, Plus, Trash, Upload as UploadIcon } from '../components/bits';
import Dialog from '../components/Dialog';
import ImportSheet from '../components/ImportSheet';
import LiveCgpa from '../components/LiveCgpa';
import StartOver from '../components/StartOver';
import { ALL_GRADES, Attempt, Grade, gpaOf, nextSemester, semesterIndex, semesterSums, TERMS } from '../engine/grades';
import { newId } from '../engine/gradesheet';
import { count, two } from '../format';
import { useStore } from '../store';

const CODE = /^[A-Z]{3}\d{3}$/;

function CourseRow({ a, replaced }: { a: Attempt; replaced: boolean }) {
  const { update, remove } = useStore();
  const bad = !!a.code && !CODE.test(a.code);
  return (
    <div className={`edit-row${replaced ? ' nt' : ''}`}>
      <input className="field mono" aria-label="Course code" value={a.code} maxLength={6} placeholder="CSE110" aria-invalid={bad}
        onChange={(e) => update(a.id, { code: e.target.value.toUpperCase().replace(/\s/g, '') })} />
      <div className="edit-title">
        <input className="field" aria-label="Course title" value={a.title} placeholder="Course title (optional)" onChange={(e) => update(a.id, { title: e.target.value })} />
        {replaced && <small>Replaced by a later attempt (NT). Still counts as attempted.</small>}
        {!CODE.test(a.code) && <small className="warn-text">Type the course code (like CSE110) to count this course.</small>}
      </div>
      <input className="field mono" type="number" min={0} max={6} step={0.5} aria-label={`Credits for ${a.code || 'this course'}`} value={a.credits}
        onChange={(e) => update(a.id, { credits: Math.max(0, Math.min(6, Number(e.target.value) || 0)) })} />
      <select className="field mono" aria-label={`Grade for ${a.code || 'this course'}`} value={a.grade} onChange={(e) => update(a.id, { grade: e.target.value as Grade })}>
        {ALL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      <button type="button" className="icon-btn" aria-label={`Remove ${a.code || 'this course'}`} onClick={() => remove(a.id)}><Trash /></button>
    </div>
  );
}

export default function Courses() {
  const store = useStore();
  const { attempts, totals: s, latest } = store;
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(attempts.length === 0);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const suggested = latest ? nextSemester(latest).split(' ') : ['Spring', String(new Date().getFullYear())];
  const [term, setTerm] = useState(suggested[0]);
  const [year, setYear] = useState(Number(suggested[1]));
  const years = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + 1 - i), []);
  const counted = new Set([...s.counted.values()].map((a) => a.id));

  const terms = useMemo(() => {
    const groups = new Map<string, Attempt[]>();
    for (const a of attempts) groups.set(a.semester, [...(groups.get(a.semester) || []), a]);
    return [...groups.entries()].sort((x, y) => semesterIndex(y[0]) - semesterIndex(x[0]));
  }, [attempts]);

  const name = `${term} ${year}`;
  const exists = terms.some(([n]) => n === name);
  const addSemester = () => {
    store.add({ id: newId(), code: '', title: '', credits: 3, grade: 'A', semester: name });
    setJustAdded(name);
    setAdding(false);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h1>My courses</h1>
        <p className="lead">Every course, semester by semester. Change anything here and all your numbers update at once.</p>
      </div>

      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => setUploading(true)}><UploadIcon /> {attempts.length ? 'Upload a new grade sheet' : 'Upload my grade sheet'}</button>
        <button type="button" className="btn btn-line" aria-expanded={adding} onClick={() => setAdding((v) => !v)}><Plus /> Add a semester</button>
        {attempts.length > 0 && <StartOver />}
      </div>

      {adding && (
        <section className="card add-term" aria-label="Add a semester">
          <p className="muted small">{attempts.length ? 'Pick the semester, then add its courses.' : 'No grade sheet? Start with your first semester, then add each course: code, credits and grade.'}</p>
          <div className="row">
            <select className="field inline" aria-label="Term" value={term} onChange={(e) => setTerm(e.target.value)}>{TERMS.map((x) => <option key={x}>{x}</option>)}</select>
            <select className="field inline mono" aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>{years.map((y) => <option key={y}>{y}</option>)}</select>
            <button type="button" className="btn btn-primary" disabled={exists} onClick={addSemester}>Add {name}</button>
          </div>
          {exists && <p className="small warn-text">{name} is already on your list.</p>}
        </section>
      )}

      {store.sheet && attempts.length > 0 && (
        <div className="notice good"><Check /><p className="small">From your grade sheet: all {store.sheet.length} semesters matched it. If you edit a course, your numbers update, but the sheet check no longer applies.</p></div>
      )}

      {terms.map(([term, list]) => {
        const gpa = gpaOf(semesterSums(list.filter((a) => CODE.test(a.code))));
        const credits = list.reduce((t, a) => t + a.credits, 0);
        const incomplete = list.some((a) => !CODE.test(a.code));
        return (
          <details key={term} className="term" open={incomplete || justAdded === term || terms.length <= 2}>
            <summary>
              <b>{term}</b>
              <span className="muted small">{count(list.length, 'course')}, {credits} credits</span>
              {gpa !== null && <span className="pill navy mono">GPA {two(gpa)}</span>}
            </summary>
            <div className="term-body">
              <div className="edit-head" aria-hidden="true"><span>Code</span><span>Title</span><span>Credits</span><span>Grade</span><span /></div>
              {list.map((a) => <CourseRow key={a.id} a={a} replaced={CODE.test(a.code) && !counted.has(a.id) && a.grade !== 'I' && a.grade !== 'W'} />)}
              <div className="row term-actions">
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => store.add({ id: newId(), code: '', title: '', credits: 3, grade: 'A', semester: term })}><Plus /> Add a course</button>
                <button type="button" className="btn btn-quiet btn-sm danger" onClick={() => store.removeSemester(term)}><Trash /> Remove {term}</button>
              </div>
            </div>
          </details>
        );
      })}

      {s.cgpa !== null && <LiveCgpa />}

      <Dialog open={uploading} onClose={() => setUploading(false)} title={attempts.length ? 'Upload a new grade sheet' : 'Upload your grade sheet'} wide>
        {attempts.length > 0 && <p className="muted small">The new sheet replaces the courses you have here now.</p>}
        <ImportSheet />
        <div className="dialog-actions"><button type="button" className="btn btn-quiet" onClick={() => setUploading(false)}>Close</button></div>
      </Dialog>
    </div>
  );
}
