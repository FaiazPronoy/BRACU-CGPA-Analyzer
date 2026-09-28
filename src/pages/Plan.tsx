import { useState } from 'react';
import { go } from '../App';
import { Plus, Trash } from '../components/bits';
import { Candidate, candidates } from '../engine/boost';
import { add, gpaOf, GRADE_POINTS, LETTER_GRADES, LetterGrade, neededGpa, Sums } from '../engine/grades';
import { planTarget } from '../engine/targets';
import { count, signedValue, two } from '../format';
import { useStore } from '../store';

interface Row { key: number; credits: number; grade: LetterGrade }
let keys = 0;
const newRow = (): Row => ({ key: keys++, credits: 3, grade: 'A-' });
// the GPA needed, rounded up: a need of 3.6049 must not read as 3.60
const ceil2 = (v: number) => Math.ceil(v * 100 - 1e-9) / 100;
const label = (g: LetterGrade) => `${g} (${GRADE_POINTS[g].toFixed(2)})`;

function NextSemester({ sums }: { sums: Sums }) {
  const [rows, setRows] = useState<Row[]>(() => [newRow(), newRow(), newRow(), newRow()]);
  const set = (key: number, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const term = gpaOf(rows.reduce((acc, r) => add(acc, r.grade, r.credits), { points: 0, credits: 0 }));
  const before = gpaOf(sums);
  const after = gpaOf(rows.reduce((acc, r) => add(acc, r.grade, r.credits), sums));
  const credits = rows.reduce((t, r) => t + r.credits, 0);
  return (
    <section className="card" aria-labelledby="ns">
      <h2 id="ns">Next semester</h2>
      <p className="muted">Set the courses you are taking and the grade you expect in each.</p>
      <div className="course-list">
        {rows.map((r, i) => (
          <div key={r.key} className="course-line">
            <span className="muted mono">{i + 1}</span>
            <select className="field" aria-label={`Credits for course ${i + 1}`} value={r.credits} onChange={(e) => set(r.key, { credits: Number(e.target.value) })}>
              {[1, 1.5, 2, 3, 4].map((c) => <option key={c} value={c}>{c} credit{c === 1 ? '' : 's'}</option>)}
            </select>
            <select className="field mono" aria-label={`Grade for course ${i + 1}`} value={r.grade} onChange={(e) => set(r.key, { grade: e.target.value as LetterGrade })}>
              {LETTER_GRADES.map((g) => <option key={g} value={g}>{label(g)}</option>)}
            </select>
            <button type="button" className="icon-btn" aria-label={`Remove course ${i + 1}`} disabled={rows.length <= 1} onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))}><Trash /></button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-quiet btn-sm" disabled={rows.length >= 7} onClick={() => setRows((x) => [...x, newRow()])}><Plus /> Add a course</button>
      <div className="big-results">
        <div><span>Semester GPA</span><b>{two(term ?? 0)}</b></div>
        <div><span>{before !== null ? 'CGPA after it' : 'Your first CGPA'}</span><b>{two(after ?? 0)}</b>
          {before !== null && after !== null && after !== before && <em className={after > before ? 'up' : 'down'}>{signedValue(after - before)}</em>}</div>
        <div><span>Credits</span><b>{credits}</b>{credits > 15 ? <em className="down">over 15 needs approval</em> : credits < 9 ? <em>under 9 is part-time</em> : null}</div>
      </div>
    </section>
  );
}

function Target({ sums, earned, needed, byRules, withPermission }: { sums: Sums; earned: number; needed: number | null; byRules: Candidate[]; withPermission: Candidate[] }) {
  const now = gpaOf(sums);
  const [target, setTarget] = useState(() => Math.min(4, Math.max(2, Math.ceil(((now ?? 3) + 0.1) * 20) / 20)));
  const [left, setLeft] = useState(() => Math.max(0, (needed ?? 136) - earned));
  const need = neededGpa(sums, target, left);
  const plan = planTarget(sums, left, target, byRules);

  let result;
  if (now !== null && now >= target && (left === 0 || (need !== null && need <= 0))) {
    result = <div className="notice good"><p>You are already at {two(target)} or above. Keep going like this and it stays yours.</p></div>;
  } else if (plan.reachable) {
    result = (
      <>
        {need !== null && (
          <div className="big-results single">
            <div><span>Average GPA you need over the next {left} credits</span><b>{two(Math.max(0, ceil2(need)))}</b></div>
          </div>
        )}
        <h3>Ways to get there with your {count(plan.courses.length, 'remaining course')}</h3>
        <ul className="outcomes">
          {plan.mixes.map((m) => (
            <li key={`${m.high}${m.highCourses}${m.low}`}>
              <span>{m.lowCourses === 0 ? `All ${count(m.highCourses, 'course')} at ${label(m.high)}` : `${count(m.highCourses, 'course')} at ${label(m.high)}, the other ${m.lowCourses} at ${label(m.low)}`}</span>
              <b>{two(m.cgpa)}</b>
            </li>
          ))}
        </ul>
        <p className="muted small">Each line is the least you need of the higher grade. A+ counts the same as A.</p>
      </>
    );
  } else {
    const loose = plan.repeats ? plan : planTarget(sums, left, target, withPermission);
    const fix = plan.repeats ?? loose.repeats;
    const best = Math.max(plan.best ?? 0, loose.best ?? 0, plan.allFour ?? 0);
    result = (
      <>
        <div className="notice warn">
          <div>
            <p><b>{two(target)} is not possible with new courses alone.</b></p>
            <p className="small">{left > 0 ? `Even 4.00 in all ${plan.courses.length} remaining courses only reaches ${two(plan.allFour ?? 0)}.` : 'You have no credits left to take, so only repeats and retakes can change your CGPA now.'}</p>
          </div>
        </div>
        {fix ? (
          <div className="fix">
            <h3>Take {fix.chosen.length === 1 ? 'this course' : `these ${fix.chosen.length} courses`} again and it works</h3>
            <ul className="picks">
              {fix.chosen.map((c) => (
                <li key={c.attempt.id}>
                  <span className="code">{c.attempt.code}</span>
                  <span className="pick-title">{c.attempt.title || c.attempt.code}<em>{c.attempt.grade} to A, {c.kind}</em></span>
                  {c.allowed === 'permission' && <span className="pill warn">Chairperson's permission</span>}
                </li>
              ))}
            </ul>
            <p>With an A in each{left > 0 ? ` and 4.00 in your ${count(plan.courses.length, 'remaining course')}` : ''}, your CGPA would be <b className="mono">{two(fix.cgpa ?? 0)}</b>.</p>
            <button type="button" className="btn btn-line btn-sm" onClick={() => go('raise')}>Plan the repeats</button>
          </div>
        ) : <p>Even with every allowed repeat and straight A grades, the most you can reach is <b>{two(best)}</b>. Aim for {two(best)} or a little lower.</p>}
      </>
    );
  }

  return (
    <section className="card" aria-labelledby="tg">
      <h2 id="tg">Reach a target</h2>
      <p className="muted">Pick a CGPA and see what it takes, counted the way Connect rounds.</p>
      <div className="chips">
        {[[2, 'to graduate'], [3.5, 'Distinction'], [3.65, 'High Distinction'], [3.8, 'Highest Distinction']].map(([v, l]) => (
          <button key={v} type="button" className="chip" aria-pressed={target === v} onClick={() => setTarget(v as number)}><b>{two(v as number)}</b> {l}</button>
        ))}
      </div>
      <div className="inputs">
        <label>Target CGPA<input id="target" className="field mono" type="number" min={1} max={4} step={0.01} value={target} onChange={(e) => setTarget(Math.min(4, Math.max(0, Number(e.target.value) || 0)))} /></label>
        <label>Credits still to take<input className="field mono" type="number" min={0} max={220} value={left} onChange={(e) => setLeft(Math.max(0, Number(e.target.value) || 0))} /><small>You have earned {earned}{needed ? ` of ${needed}` : ''}.</small></label>
      </div>
      {result}
    </section>
  );
}

// without a transcript: a CGPA is already rounded, so this is an estimate and says so
function Quick() {
  const [cgpa, setCgpa] = useState(3.2);
  const [credits, setCredits] = useState(60);
  const [gpa, setGpa] = useState(3.5);
  const [termCredits, setTermCredits] = useState(12);
  const [old, setOld] = useState<LetterGrade>('C');
  const [fresh, setFresh] = useState<LetterGrade>('A');
  const [oldCredits, setOldCredits] = useState(3);
  const ok = credits > 0 && cgpa >= 0 && cgpa <= 4;
  const shown = (v: number) => two(Math.min(4, Math.max(0, Math.round(v * 100) / 100)));
  return (
    <section className="card" aria-labelledby="qk">
      <h2 id="qk">Quick estimate</h2>
      <p className="muted">No grade sheet at hand? Type the CGPA and credits from Connect.</p>
      <div className="inputs">
        <label>Your CGPA now<input className="field mono" type="number" min={0} max={4} step={0.01} value={cgpa} onChange={(e) => setCgpa(Number(e.target.value))} /></label>
        <label>Credits counted in it<input className="field mono" type="number" min={1} max={220} value={credits} onChange={(e) => setCredits(Number(e.target.value))} /><small>Credits earned, plus any F not retaken yet.</small></label>
      </div>
      <div className="two">
        <div className="sub-card">
          <h3>After one more semester</h3>
          <div className="inputs">
            <label>GPA<input className="field mono" type="number" min={0} max={4} step={0.01} value={gpa} onChange={(e) => setGpa(Number(e.target.value))} /></label>
            <label>Credits<input className="field mono" type="number" min={1} max={24} value={termCredits} onChange={(e) => setTermCredits(Number(e.target.value))} /></label>
          </div>
          <p>Your CGPA becomes about <b className="mono big">{ok ? shown((cgpa * credits + gpa * termCredits) / (credits + termCredits)) : 'n/a'}</b></p>
        </div>
        <div className="sub-card">
          <h3>After one repeat or retake</h3>
          <div className="inputs three">
            <label>Old grade<select className="field mono" value={old} onChange={(e) => setOld(e.target.value as LetterGrade)}>{LETTER_GRADES.map((g) => <option key={g}>{g}</option>)}</select></label>
            <label>New grade<select className="field mono" value={fresh} onChange={(e) => setFresh(e.target.value as LetterGrade)}>{LETTER_GRADES.map((g) => <option key={g}>{g}</option>)}</select></label>
            <label>Credits<input className="field mono" type="number" min={1} max={6} value={oldCredits} onChange={(e) => setOldCredits(Number(e.target.value))} /></label>
          </div>
          <p>Your CGPA becomes about <b className="mono big">{ok ? shown((cgpa * credits - GRADE_POINTS[old] * oldCredits + GRADE_POINTS[fresh] * oldCredits) / credits) : 'n/a'}</b></p>
        </div>
      </div>
      <p className="muted small">An estimate: the CGPA you type is already rounded, so this can be off by 0.01. Upload your grade sheet for the exact figure.</p>
    </section>
  );
}

type Tool = 'next' | 'target' | 'quick';

export default function Plan() {
  const { totals: s, needed, valid, next } = useStore();
  const has = s.cgpa !== null;
  const [tool, setTool] = useState<Tool>(() => {
    // the dashboard's "Reach a target" card opens this page straight on the target
    let asked: string | null = null;
    try {
      asked = sessionStorage.getItem('hisab:planTab');
      sessionStorage.removeItem('hisab:planTab');
    } catch {
      /* fine */
    }
    return asked === 'target' ? 'target' : has ? 'next' : 'quick';
  });
  // courses already at A or A+ have nothing to gain, so the engine leaves them out
  const pool = next ? candidates(valid, next, 'A') : [];
  const shown: Tool = has ? tool : 'quick';

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Plan ahead</h1>
        <p className="lead">{has ? 'Try next semester before it happens, find what a target CGPA needs, or run a quick estimate.' : 'No grades here yet: the quick estimate works with just your CGPA and credits.'}</p>
      </div>
      {has && (
        <div className="segmented" role="tablist" aria-label="Planning tools">
          {([['next', 'Next semester'], ['target', 'Reach a target'], ['quick', 'Quick estimate']] as [Tool, string][]).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={shown === k} onClick={() => setTool(k)}>{l}</button>
          ))}
        </div>
      )}
      {shown === 'next' && <NextSemester sums={s.sums} />}
      {shown === 'target' && <Target sums={s.sums} earned={s.earned} needed={needed} byRules={pool.filter((c) => c.allowed === 'yes')} withPermission={pool.filter((c) => c.allowed !== 'no')} />}
      {shown === 'quick' && <Quick />}
    </div>
  );
}
