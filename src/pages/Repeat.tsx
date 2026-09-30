import { useEffect, useMemo, useState } from 'react';
import { go } from '../App';
import { Candidate, candidates, cgpaWithGains, gainFor, scenarios } from '../engine/boost';
import { GRADE_POINTS, LetterGrade, semesterIndex, semesterName } from '../engine/grades';
import { count, signedValue, two } from '../format';
import { useStore } from '../store';

const HOPES: LetterGrade[] = ['A', 'A-', 'B+', 'B'];
// "an A", "a B+": the grade the way it is said in a sentence
const said = (g: LetterGrade) => (g.startsWith('A') ? `an ${g}` : `a ${g}`);

// how far back a course was first taken, counted up to the semester being planned
const since = (c: Candidate, next: string) => semesterIndex(next) - semesterIndex(c.firstSemester);

function status(c: Candidate, next: string) {
  if (c.allowed === 'yes') return c.kind === 'retake' ? { tone: 'good', text: 'Retake: you got an F' } : { tone: 'good', text: `Repeat, allowed until ${c.lastChance}` };
  if (c.allowed === 'permission') {
    if (c.why === 'thirdRetake') return { tone: 'warn', text: 'Both retakes used, needs an exception' };
    return { tone: 'warn', text: `Needs Chairperson's permission (taken ${since(c, next)} semesters ago)` };
  }
  return { tone: 'pen', text: 'Already repeated once, cannot repeat again' };
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
        <h1>Repeat or Retake</h1>
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
      <div className="page-head page-head-split">
        <div className="page-head">
          <h1>Repeat or Retake</h1>
          <p className="lead">Tell us how many courses you want to take again, and we will pick the ones that raise your CGPA the&nbsp;most.</p>
          <p className="muted small explain">
            <b>Repeat</b> means taking a course you passed again, to get a better grade. <b>Retake</b> means taking a course you
            failed (F) again. Either way, the new grade takes the place of the old one in your&nbsp;CGPA.
          </p>
        </div>
        {/* the starting point, so every number below reads against it */}
        <div className="now-card" aria-label="Your CGPA now">
          <span>Your CGPA now</span>
          <b className="mono">{two(s.cgpa)}</b>
          <small>{s.earned} credits earned</small>
        </div>
      </div>

      <section className="card controls" aria-label="Your plan">
        <p className="sentence">
          <span className="phrase">
            <span>I will Repeat/Retake</span>
            <span className="stepper" role="group" aria-label="How many courses">
              <button type="button" onClick={() => setN((v) => Math.max(1, v - 1))} disabled={n <= 1} aria-label="One fewer">{'−'}</button>
              <output aria-live="polite">{n}</output>
              <button type="button" onClick={() => setN((v) => Math.min(max, v + 1))} disabled={n >= max} aria-label="One more">+</button>
            </span>
          </span>
          <span className="phrase">
            <span>{n === 1 ? 'course' : 'courses'} and expect</span>
            <select className="field inline mono" aria-label="Grade you expect" value={hope} onChange={(e) => setHope(e.target.value as LetterGrade)}>
              {HOPES.map((g) => <option key={g} value={g}>{said(g)}</option>)}
            </select>
          </span>
          <span className="phrase">
            <span>in</span>
            <select className="field inline" aria-label="Semester you are planning for" value={next} onChange={(e) => store.setNext(e.target.value)}>
              {semesters.map((x) => <option key={x}>{x}</option>)}
            </select>
          </span>
        </p>
        <div className="toggle" role="radiogroup" aria-label="Which courses">
          <button type="button" role="radio" aria-checked={!wide} onClick={() => setWide(false)}>
            <b>Courses from my last 2 semesters</b><span>Courses you took in your last 2 semesters, plus any course you got an F in. You can take these at advising without asking anyone.</span>
          </button>
          <button type="button" role="radio" aria-checked={wide} onClick={() => setWide(true)}>
            <b>Also older courses</b><span>Also counts courses you took more than 2 semesters ago. For these you need your Chairperson's permission.</span>
          </button>
        </div>
      </section>

      <div className="compare" aria-label="The three ways, side by side">
        {([['rules', 'From your last 2 semesters'], ['permission', "Older courses too, with your Chairperson's permission"], ['retakes', 'Only the courses you failed (F)']] as const).map(([k, label]) => {
          const p = plans[k];
          const m = p.chosen.length;
          const say = !m ? 'No course fits here, so your CGPA stays the same'
            : k === 'retakes' ? `Retake ${m === 1 ? 'this 1 failed course' : `these ${m} failed courses`} and your CGPA becomes`
            : `Repeat/Retake your best ${m === 1 ? 'course' : `${m} courses`} and your CGPA becomes`;
          return (
            <div key={k} className={`compare-card${(k === 'rules' && !wide) || (k === 'permission' && wide) ? ' on' : ''}`}>
              <span>{label}</span>
              <em>{say}</em>
              <b className="mono">{two(m ? p.cgpa! : s.cgpa!)}</b>
            </div>
          );
        })}
      </div>

      {pool.length === 0 ? (
        <section className="card result empty-result">
          <h2>{all.length ? 'Nothing you can take at advising right now' : 'Nothing to gain here'}</h2>
          <p className="muted">{all.length ? 'Every course that would help was taken more than 2 semesters ago. Choose "Also older courses" above to see them.' : `Every counted grade is already ${hope} or better.`}</p>
        </section>
      ) : (
        <section className="card result" aria-labelledby="result">
          <p className="result-label" id="result">
            {plan.chosen.length === 1 ? `If you Repeat/Retake this 1 course and get ${said(hope)}, your CGPA becomes`
              : `If you Repeat/Retake these ${plan.chosen.length} courses and get ${said(hope)} in each, your CGPA becomes`}
          </p>
          <p className="result-number">{two(plan.cgpa!)} <span className="pill good">{signedValue(gain)}</span></p>
          <p className="muted small">Your CGPA is {two(s.cgpa)} now.</p>
          {plan.chosen.length < n && (
            <p className="small warn-text">You asked for {n} courses, but only {plan.chosen.length} {plan.chosen.length === 1 ? 'fits' : 'fit'} here{plan.chosen.length > 1 ? `, so these are the ${plan.chosen.length}` : ''}.</p>
          )}
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
          {plan.steps.length > 1 && <p className="muted small">If you take fewer: {plan.steps.map((st) => `${count(st.count, 'course')}: ${two(st.cgpa!)}`).join(' · ')}</p>}
          {credits > 15 && <p className="small warn-text">That is {credits} credits, more than one semester (15) holds, so spread them over two.</p>}
        </section>
      )}

      {pool.length > 0 && (
        <details className="card fold">
          <summary><b>Or pick the courses yourself</b><span>Tick the ones you are thinking about and watch your CGPA change.</span></summary>
          <div className="fold-body">
            <p className="muted small">
              {chosen.length ? <>With the {count(chosen.length, 'course')} you ticked, your CGPA becomes <b className="mono">{two(mine.cgpa!)}</b>.</>
                : <>Nothing ticked yet. Your CGPA now is <b className="mono">{two(s.cgpa)}</b>.</>}{' '}
              The small number on the right is your CGPA if you take only that one course again.
            </p>
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
