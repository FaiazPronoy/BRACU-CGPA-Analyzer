import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react';
import { go } from '../App';
import { Check, FileIcon, Lock, Plus, Trash, Upload, Warn } from '../components/bits';
import { ALL_GRADES, Attempt, Grade, nextSemester, semesterIndex, TERMS } from '../engine/grades';
import { checkSheet, FIGURES, newId, ParsedSheet, readGradeSheet } from '../engine/gradesheet';
import { detectProgram } from '../engine/programs';
import { useLang } from '../i18n';
import { sampleTranscript } from '../sample';
import { useStore } from '../store';

const CODE = /^[A-Z]{3}\d{3}$/;

function SheetCheck({ sheet, file, onUse, onCancel, replacing }: { sheet: ParsedSheet; file: string; onUse: () => void; onCancel: () => void; replacing: boolean }) {
  const { t, num, sem } = useLang();
  const checks = checkSheet(sheet);
  const wrong = checks.filter((c) => !c.ok);
  const ok = checks.length > 0 && !wrong.length;
  const last = sheet.terms[sheet.terms.length - 1];
  const show = (k: string, v: number) => num(v, k === 'gpa' || k === 'cgpa' ? 2 : 0);

  return (
    <section className="card stack" aria-labelledby="check-title" style={{ borderColor: ok ? 'var(--good)' : 'var(--warn)' }}>
      <h2 id="check-title">{t('grades.checkTitle')}</h2>
      <p>{t('grades.found', { courses: sheet.attempts.length, semesters: checks.length })}</p>
      {(() => {
        const prog = detectProgram(sheet.program, file);
        return prog
          ? <p className="small"><b>{t('grades.program')}</b> {t(`programs.${prog.code}`)} <span className="muted">({t('grades.programCredits', { n: prog.credits })})</span></p>
          : <p className="small muted">{t('grades.programUnknown')}</p>;
      })()}
      <div className={`notice ${ok ? 'good' : 'warn'}`}>
        {ok ? <Check /> : <Warn />}
        <div>
          <p style={{ fontWeight: 800 }}>
            {ok ? t('grades.allMatch', { n: checks.length, cgpa: num(last.cgpa, 2) }) : checks.length ? t('grades.someWrong', { bad: wrong.length, n: checks.length }) : t('grades.noSummary')}
          </p>
          <p className="small" style={{ marginTop: 4 }}>{ok ? t('grades.allMatchText') : t('grades.someWrongText')}</p>
          {wrong.length > 0 && (
            <ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {wrong.map((c) => (
                <li key={c.semester}>
                  <b>{sem(c.semester)}</b>:{' '}
                  {FIGURES.filter((k) => Math.abs(c.figures[k][0] - c.figures[k][1]) >= 0.001)
                    .map((k) => t('grades.diffLine', { what: t(`fig.${k}`), ours: show(k, c.figures[k][0]), sheet: show(k, c.figures[k][1]) }))
                    .join('; ')}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <details>
        <summary className="small" style={{ cursor: 'pointer', fontWeight: 700 }}>{t('grades.seeCheck')}</summary>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="plain">
            <thead>
              <tr>
                <th scope="col">{t('fig.semester')}</th>
                <th scope="col" className="num">{t('fig.gpa')}</th>
                <th scope="col" className="num">{t('fig.cgpa')}</th>
                <th scope="col" className="num">{t('fig.cumAttempted')}</th>
                <th scope="col" className="num">{t('fig.cumEarned')}</th>
                <th scope="col"><span className="sr-only">{t('grades.result')}</span></th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.semester}>
                  <th scope="row">{sem(c.semester)}</th>
                  <td className="num">{num(c.figures.gpa[1], 2)}</td>
                  <td className="num">{num(c.figures.cgpa[1], 2)}</td>
                  <td className="num">{num(c.figures.cumAttempted[1])}</td>
                  <td className="num">{num(c.figures.cumEarned[1])}</td>
                  <td>{c.ok ? <span className="tag good">{t('grades.matches')}</span> : <span className="tag warn">{t('grades.differs')}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {sheet.guessed.length > 0 && <p className="small muted">{t('grades.guessed', { list: sheet.guessed.join(', ') })}</p>}
      {replacing && <p className="small muted">{t('grades.replacing')}</p>}
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={onUse}>{t('grades.useThese')}</button>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>{t('grades.cancel')}</button>
      </div>
    </section>
  );
}

function Uploader({ onRead }: { onRead: (s: ParsedSheet, file: string) => void }) {
  const { t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  const read = async (file?: File) => {
    if (!file) return;
    setError('');
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return setError(t('grades.notPdf'));
    setBusy(true);
    try {
      const sheet = await readGradeSheet(file);
      if (!sheet.attempts.length) setError(t('grades.nothing'));
      else onRead(sheet, file.name);
    } catch {
      setError(t('grades.cannotRead'));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <div
        className={`dropzone${over ? ' over' : ''}`}
        onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); read(e.dataTransfer.files[0]); }}
      >
        <span className="icon"><FileIcon /></span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ fontWeight: 800, fontSize: '1.05rem' }}>{t('grades.uploadTitle')}</p>
          <p className="small muted">{t('grades.uploadText')}</p>
          <p className="small muted row" style={{ gap: 6, marginTop: 4 }}><span style={{ width: 16, display: 'inline-flex' }}><Lock /></span>{t('grades.private')}</p>
        </div>
        <input ref={input} type="file" accept="application/pdf,.pdf" hidden tabIndex={-1} onChange={(e: ChangeEvent<HTMLInputElement>) => read(e.target.files?.[0])} />
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>
          <Upload /> {busy ? t('grades.reading') : t('grades.choose')}
        </button>
      </div>
      {error && <p role="alert" className="small" style={{ color: 'var(--pen)', fontWeight: 700, marginTop: 8 }}>{error}</p>}
    </div>
  );
}

function CourseRow({ a, replaced }: { a: Attempt; replaced: boolean }) {
  const { t } = useLang();
  const { update, remove } = useStore();
  const badCode = !!a.code && !CODE.test(a.code);
  return (
    <div className={`course-row${replaced ? ' nt' : ''}`}>
      <div>
        <label className="sr-only" htmlFor={`c-${a.id}`}>{t('grades.code')}</label>
        <input id={`c-${a.id}`} className="field code" value={a.code} maxLength={6} placeholder="CSE110" aria-invalid={badCode}
          style={badCode ? { borderColor: 'var(--pen)' } : undefined}
          onChange={(e) => update(a.id, { code: e.target.value.toUpperCase().replace(/\s/g, '') })} />
      </div>
      <div className="title-cell">
        <label className="sr-only" htmlFor={`t-${a.id}`}>{t('grades.courseTitle')}</label>
        <input id={`t-${a.id}`} className="field" value={a.title} placeholder={t('grades.titlePh')} onChange={(e) => update(a.id, { title: e.target.value })} />
        {replaced && <p className="hint">{t('grades.replaced')}</p>}
        {!CODE.test(a.code) && <p className="hint" style={{ color: 'var(--warn)' }}>{t('grades.needsCode')}</p>}
      </div>
      <div>
        <label className="sr-only" htmlFor={`cr-${a.id}`}>{t('grades.credits')}</label>
        <input id={`cr-${a.id}`} className="field mono" type="number" min={0} max={6} step={0.5} value={a.credits}
          onChange={(e) => update(a.id, { credits: Math.max(0, Math.min(6, Number(e.target.value) || 0)) })} />
      </div>
      <div>
        <label className="sr-only" htmlFor={`g-${a.id}`}>{t('grades.grade')}</label>
        <select id={`g-${a.id}`} className="field mono" value={a.grade} onChange={(e) => update(a.id, { grade: e.target.value as Grade })}>
          {ALL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <button type="button" className="icon-btn" aria-label={t('grades.removeCourse', { code: a.code || t('grades.thisCourse') })} onClick={() => remove(a.id)}><Trash /></button>
    </div>
  );
}

export default function Grades() {
  const { t, num, sem } = useLang();
  const store = useStore();
  const { attempts, rows, totals: s } = store;
  const [sheet, setSheet] = useState<{ parsed: ParsedSheet; file: string } | null>(null);
  const [sure, setSure] = useState(false);
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => now + 1 - i);
  }, []);
  const suggested = store.latest ? nextSemester(store.latest).split(' ') : ['Spring', String(new Date().getFullYear())];
  const [term, setTerm] = useState(suggested[0]);
  const [year, setYear] = useState(Number(suggested[1]));

  const addSemester = () => {
    const name = `${term} ${year}`;
    store.add({ id: newId(), code: '', title: '', credits: 3, grade: 'A', semester: name });
  };

  const counted = new Set([...s.counted.values()].map((a) => a.id));
  // every semester in the editor, including one whose rows are still being typed
  const terms = useMemo(() => {
    const groups = new Map<string, Attempt[]>();
    for (const a of attempts) groups.set(a.semester, [...(groups.get(a.semester) || []), a]);
    return [...groups.entries()].sort((x, y) => semesterIndex(x[0]) - semesterIndex(y[0]));
  }, [attempts]);

  return (
    <div className="stack" style={{ '--gap': '22px' } as React.CSSProperties}>
      <div>
        <p className="eyebrow">{t('grades.eyebrow')}</p>
        <h1 className="page-title">{t('grades.title')}</h1>
        <p className="lead">{t('grades.lead')}</p>
      </div>

      {sheet ? (
        <SheetCheck sheet={sheet.parsed} file={sheet.file} replacing={attempts.length > 0} onCancel={() => setSheet(null)}
          onUse={() => {
            store.setAll(sheet.parsed.attempts, sheet.parsed.terms, detectProgram(sheet.parsed.program, sheet.file)?.code ?? null);
            setSheet(null);
            go('overview');
          }} />
      ) : (
        <>
          <Uploader onRead={(parsed, file) => setSheet({ parsed, file })} />
          {!attempts.length && (
            <div className="row">
              <button type="button" className="btn btn-line" onClick={() => { store.setAll(sampleTranscript(), null, 'CSE'); go('overview'); }}>{t('grades.trySample')}</button>
              <span className="small muted">{t('grades.orManual')}</span>
            </div>
          )}
        </>
      )}

      {store.sheet && attempts.length > 0 && (
        <div className="notice good"><Check /><p className="small">{t('grades.checkedBadge', { n: store.sheet.length })}</p></div>
      )}

      {terms.map(([name, list]) => {
        const r = rows.find((x) => x.semester === name);
        return (
        <section key={name} className="term" aria-labelledby={`h-${name}`}>
          <div className="term-head">
            <h3 id={`h-${name}`}>{sem(name)}</h3>
            {r && <span className="small muted">{t('grades.termLine', { credits: r.attempted })}</span>}
            {r?.gpa != null && <span className="tag navy mono">{t('fig.gpa')} {num(r.gpa, 2)}</span>}
            {r?.cgpa != null && <span className="tag mono">{t('fig.cgpa')} {num(r.cgpa, 2)}</span>}
            <button type="button" className="icon-btn" aria-label={t('grades.removeTerm', { term: sem(name) })} onClick={() => store.removeSemester(name)}><Trash /></button>
          </div>
          {list.map((a) => <CourseRow key={a.id} a={a} replaced={counted.size > 0 && CODE.test(a.code) && !counted.has(a.id) && a.grade !== 'I' && a.grade !== 'W'} />)}
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--line)' }}>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => store.add({ id: newId(), code: '', title: '', credits: 3, grade: 'A', semester: name })}>
              <Plus /> {t('grades.addCourse')}
            </button>
          </div>
        </section>
        );
      })}

      <section className="card sunk" aria-labelledby="add-term">
        <h2 id="add-term" style={{ fontSize: '1.05rem' }}>{attempts.length ? t('grades.addTerm') : t('grades.startManual')}</h2>
        <div className="row" style={{ marginTop: 10 }}>
          <label className="sr-only" htmlFor="term">{t('grades.term')}</label>
          <select id="term" className="field" style={{ width: 'auto' }} value={term} onChange={(e) => setTerm(e.target.value)}>
            {TERMS.map((x) => <option key={x} value={x}>{sem(`${x} 2000`).split(' ')[0]}</option>)}
          </select>
          <label className="sr-only" htmlFor="year">{t('grades.year')}</label>
          <select id="year" className="field mono" style={{ width: 'auto' }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{num(y)}</option>)}
          </select>
          <button type="button" className="btn btn-primary" onClick={addSemester}
            disabled={terms.some(([n]) => n === `${term} ${year}`)}><Plus /> {t('grades.addTermBtn')}</button>
        </div>
        {terms.some(([n]) => n === `${term} ${year}`) && <p className="hint">{t('grades.termExists')}</p>}
        {!attempts.length && <p className="hint">{t('grades.manualHint')}</p>}
      </section>

      {attempts.length > 0 && (
        <div className="row spread no-print">
          <button type="button" className="btn btn-primary" onClick={() => go('overview')}>{t('grades.toOverview')}</button>
          {sure ? (
            <span className="row">
              <span className="small">{t('grades.clearSure')}</span>
              <button type="button" className="btn btn-pen btn-sm" onClick={() => { store.clear(); setSure(false); }}>{t('grades.clearYes')}</button>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setSure(false)}>{t('grades.cancel')}</button>
            </span>
          ) : (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setSure(true)}><Trash /> {t('grades.clear')}</button>
          )}
        </div>
      )}
    </div>
  );
}
