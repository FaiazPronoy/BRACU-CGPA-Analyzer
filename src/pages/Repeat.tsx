import { useEffect, useMemo, useState } from 'react';
import { go } from '../App';
import { Candidate, candidates, cgpaWithGains, gainFor, scenarios } from '../engine/boost';
import { GRADE_POINTS, LetterGrade, semesterIndex, semesterName } from '../engine/grades';
import { count, signedValue, two } from '../format';
import { useStore } from '../store';

const HOPES: LetterGrade[] = ['A', 'A-', 'B+', 'B'];

// how far back a course was first taken, counted up to the semester being planned
const since = (c: Candidate, next: string) => semesterIndex(next) - semesterIndex(c.firstSemester);

function status(c: Candidate, next: string) {
  if (c.allowed === 'yes') return c.kind === 'retake' ? { tone: 'good', text: 'Retake (F)' } : { tone: 'good', text: `Repeat by ${c.lastChance}` };
  if (c.allowed === 'permission') {
    if (c.why === 'thirdRetake') return { tone: 'warn', text: 'Both retakes used: exception only' };
    return { tone: 'warn', text: `Chairperson's permission required (${since(c, next)} semesters ago)` };
  }
  return { tone: 'pen', text: 'Already repeated once' };
}

export default function Repeat() {
  const store = useStore();
  const { valid, totals: s, next, latest } = store;
  const [n, setN] = useState(3);
  const [hope, setHope] = useState<LetterGrade>('A');
  const [wide, setWide] = useState(false);
  const [picked, setPicked] = useState<Record<string, LetterGrade | undefined>>({});
  const [showAll, setShowAll] = useState(false);

  // courses already at the grade hoped for (A and A+ are both 4.00) have nothing to gain
  const all = useMemo(() => (next ? candidates(valid, next, hope) : []), [valid, next, hope]);
  const pool = all.filter((c) => (wide ? c.allowed !== 'no' : c.allowed === 'yes'));
  const max = Math.max(1, Math.min(10, pool.length));
  useEffect(() => {
    if (n > max) setN(max);
  }, [n, max]);

  if (s.cgpa === null || !next || !latest) {
    return (
      <div className="page-head">
        <h1>Repeat or retake</h1>
        <p className="lead">Add your grades first, then come back to see which courses are worth taking again.</p>
        <button type="button" className="btn btn-primary" onClick={() => go('home')}>Add my grades</button>
      </div>
    );
  }

  const plans = scenarios(s.sums, all, n);
  const plan = wide ? plans.permission : plans.rules;
  const gain = plan.cgpa !== null ? plan.cgpa - s.cgpa : 0;
  const chosen = pool.filter((c) => picked[c.attempt.id]);
  const mine = cgpaWithGains(s.sums, chosen.map((c) => gainFor(c.attempt, picked[c.attempt.id]!)));
  const semesters = [0, 1, 2, 3].map((i) => semesterName(semesterIndex(latest) + 1 + i));
  const credits = plan.chosen.reduce((t, c) => t + c.attempt.credits, 0);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Repeat or retake</h1>
        <p className="lead">Taking a course again replaces the old grade. Say how many you can manage, and Hisab picks the ones that lift your CGPA the&nbsp;most.</p>
      </div>

      <section className="card controls" aria-label="Your plan">
        <p className="sentence">
          <span>I can take</span>
          <span className="stepper" role="group" aria-label="How many courses">
            <button type="button" onClick={() => setN((v) => Math.max(1, v - 1))} disabled={n <= 1} aria-label="One fewer">{'−'}</button>
            <output aria-live="polite">{n}</output>
            <button type="button" onClick={() => setN((v) => Math.min(max, v + 1))} disabled={n >= max} aria-label="One more">+</button>
          </span>
          <span>{n === 1 ? 'course' : 'courses'} again and expect</span>
          <select className="field inline mono" aria-label="Grade you expect" value={hope} onChange={(e) => setHope(e.target.value as LetterGrade)}>
            {HOPES.map((g) => <option key={g} value={g}>{g === 'A' ? 'an A' : g === 'A-' ? 'an A-' : `a ${g}`}</option>)}
          </select>
          <span>in</span>
          <select className="field inline" aria-label="Semester you are planning for" value={next} onChange={(e) => store.setNext(e.target.value)}>
            {semesters.map((x) => <option key={x}>{x}</option>)}
          </select>
        </p>
        <div className="toggle" role="radiogroup" aria-label="Which courses">
          <button type="button" role="radio" aria-checked={!wide} onClick={() => setWide(false)}>
            <b>Only what I can register for</b><span>F retakes, and repeats within 2 semesters</span>
          </button>
          <button type="button" role="radio" aria-checked={wide} onClick={() => setWide(true)}>
            <b>Include older courses</b><span>These need your Chairperson's permission</span>
          </button>
        </div>
      </section>

      {pool.length === 0 ? (
        <section className="card result empty-result">
          <h2>{all.length ? 'Nothing you can register for right now' : 'Nothing to gain here'}</h2>
          <p className="muted">{all.length ? 'Every course that would help is past its 2 semester window. Switch on "Include older courses" to see them.' : `Every counted grade is already ${hope} or better.`}</p>
        </section>
      ) : (
        <section className="card result" aria-labelledby="result">
          <p className="result-label" id="result">Your CGPA could become</p>
          <p className="result-number">{two(plan.cgpa!)} <span className="pill good">{signedValue(gain)}</span></p>
          <p className="muted small">from {two(s.cgpa)} now, with {count(plan.chosen.length, 'course')} at {hope}{plan.chosen.length < n ? ` (only ${plan.chosen.length} qualify)` : ''}.</p>
          <ul className="picks">
            {plan.chosen.map((c) => {
              const st = status(c, next);
              return (
                <li key={c.attempt.id}>
                  <span className="code">{c.attempt.code}</span>
                  <span className="pick-title">{c.attempt.title || c.attempt.code}<em>{c.attempt.grade} to {hope}, {c.attempt.credits} credits, first taken {c.firstSemester}</em></span>
                  <span className={`pill ${st.tone}`}>{st.text}</span>
                </li>
              );
            })}
          </ul>
          {plan.steps.length > 1 && <p className="muted small">One at a time: {plan.steps.map((st) => `${st.count} course${st.count > 1 ? 's' : ''} ${two(st.cgpa!)}`).join(', ')}.</p>}
          {credits > 15 && <p className="small warn-text">That is {credits} credits, more than one semester (15) holds, so spread them over two.</p>}
        </section>
      )}

      {pool.length > 0 && (
        <details className="card fold">
          <summary><b>Choose courses yourself</b><span>Tick the ones you are thinking about and see your CGPA change.</span></summary>
          <div className="fold-body">
            <p className="muted small">Your pick: <b className="mono">{two(mine.cgpa ?? s.cgpa)}</b> with {count(chosen.length, 'course')}. The number on the right is your CGPA if only that course comes back.</p>
            <ul className="picks selectable">
              {pool.filter((c, i) => showAll || i < 8 || picked[c.attempt.id]).map((c) => {
                const st = status(c, next);
                const on = !!picked[c.attempt.id];
                const alone = cgpaWithGains(s.sums, [gainFor(c.attempt, picked[c.attempt.id] ?? hope)]).cgpa!;
                return (
                  <li key={c.attempt.id}>
                    <input type="checkbox" id={`p-${c.attempt.id}`} checked={on} onChange={() => setPicked((p) => ({ ...p, [c.attempt.id]: on ? undefined : hope }))} />
                    <label htmlFor={`p-${c.attempt.id}`} className="pick-title">
                      <span><span className="code">{c.attempt.code}</span> {c.attempt.title}</span>
                      <em>now {c.attempt.grade}, taken {c.attempt.semester} <span className={`pill ${st.tone}`}>{st.text}</span></em>
                    </label>
                    {on && (
                      <select className="field inline mono" aria-label={`Grade you expect in ${c.attempt.code}`} value={picked[c.attempt.id]}
                        onChange={(e) => setPicked((p) => ({ ...p, [c.attempt.id]: e.target.value as LetterGrade }))}>
                        {HOPES.filter((g) => GRADE_POINTS[g] > GRADE_POINTS[c.attempt.grade as LetterGrade]).map((g) => <option key={g}>{g}</option>)}
                      </select>
                    )}
                    <span className="mono small" title="Your CGPA if only this course comes back">{two(alone)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="row">
              {pool.length > 8 && <button type="button" className="btn btn-quiet btn-sm" onClick={() => setShowAll((v) => !v)}>{showAll ? 'Show the top 8' : `Show all ${pool.length}`}</button>}
              {chosen.length > 0 && <button type="button" className="btn btn-quiet btn-sm" onClick={() => setPicked({})}>Clear my pick</button>}
            </div>
          </div>
        </details>
      )}

      <details className="card fold">
        <summary><b>How repeats and retakes work at BRACU</b><span>The rules behind every number on this page.</span></summary>
        <ul className="fold-body rules-list">
          <li><b>Retake</b> (after an F): up to two more tries, a third only by exception. The best grade counts.</li>
          <li><b>Repeat</b> (to improve a pass): once per course, within 2 semesters of first taking it; later needs your Chairperson's permission. The latest grade counts, even if it is lower.</li>
          <li>Either way the old grade stops counting and the credits stay the same, so only the grade points change. The old attempt stays on your sheet as NT.</li>
          <li>Seats and your department can change things. Check with your advisor before you register.</li>
        </ul>
      </details>
    </div>
  );
}
