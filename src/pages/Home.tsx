import { useState } from 'react';
import { go } from '../App';
import { Arrow, ArrowDown, Calendar, Check, Printer, Rise, Target } from '../components/bits';
import Chart from '../components/Chart';
import ImportSheet from '../components/ImportSheet';
import QuickEstimate from '../components/QuickEstimate';
import { candidates, scenarios } from '../engine/boost';
import { GRADE_POINTS, honourOf, LETTER_GRADES, LetterGrade, levelOf, projectedCgpa, projectedSplit, standingOf, TermRow } from '../engine/grades';
import { PROGRAMS } from '../engine/programs';
import { gradeCounts } from '../engine/targets';
import { count, signed, two } from '../format';
import { sampleTranscript } from '../sample';
import { useStore } from '../store';

const LEVEL = { freshman: 'Freshman', sophomore: 'Sophomore', junior: 'Junior', senior: 'Senior', advancedSenior: 'Advanced Senior' };
const HONOUR = { highest: 'Highest Distinction', high: 'High Distinction', distinction: 'Distinction' };
const STANDING = { good: 'Good standing', probation: 'On probation', review: 'Under review' };

function Landing() {
  const store = useStore();
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">For BRAC University students</p>
          <h1>Know your CGPA, and how to <span className="pen-underline">raise&nbsp;it</span>.</h1>
          <p className="lead">Upload the grade sheet from Connect. You get every semester at a glance, the repeats or retakes that lift your CGPA most, and what your target really takes.</p>
          <ol className="steps">
            <li><b>1</b><span>On Connect, open <em>Grade Sheet</em> and press <em>Download</em>.</span></li>
            <li><b>2</b><span>Drop the PDF here. It is read on your device.</span></li>
            <li><b>3</b><span>Every semester is checked against your sheet, then your dashboard opens.</span></li>
          </ol>
        </div>
        <div className="card landing-card">
          <ImportSheet big />
          <div className="or"><span>or</span></div>
          <div className="landing-alt">
            <button type="button" className="btn btn-line" onClick={() => go('courses')}>Type my grades in</button>
            <button type="button" className="btn btn-quiet" onClick={() => { store.setAll(sampleTranscript(), null, 'CSE'); go('home'); }}>Try a sample student</button>
          </div>
          <button type="button" className="link-btn small quick-link" onClick={() => document.getElementById('quick')?.scrollIntoView({ behavior: 'smooth' })}>
            Rather not upload anything? Use the quick estimate below <ArrowDown />
          </button>
        </div>
      </section>
      <div id="quick">
        <QuickEstimate intro="Rather not upload your grade sheet? Type the CGPA and credits shown on Connect, and see what next semester or a repeat would do." />
      </div>
      <section className="features" aria-label="What CGPA Analyzer does">
        {[
          ['See every semester', 'A graph of your CGPA, your best and toughest terms, and your VC\'s and Dean\'s Lists.'],
          ['Know what to repeat', 'The repeats or retakes that lift your CGPA most, within BRACU\'s rules.'],
          ['Hit your target', 'Exactly what you need for 3.50 or any CGPA, or a clear answer if it cannot be done.'],
          ['Counted right', 'BRACU\'s rounding and retake rules, checked against real grade sheets.'],
        ].map(([h, p]) => (
          <div key={h} className="feature"><Check /><div><h3>{h}</h3><p>{p}</p></div></div>
        ))}
      </section>
    </div>
  );
}

function Highlights({ rows }: { rows: TermRow[] }) {
  const graded = rows.filter((r) => r.gpa !== null);
  const best = graded.reduce((b, r) => (r.gpa! > b.gpa! ? r : b));
  const worst = graded.reduce((b, r) => (r.gpa! < b.gpa! ? r : b));
  const up = rows.reduce<TermRow | null>((b, r) => ((r.change ?? 0) > (b?.change ?? 0) ? r : b), null);
  const down = rows.reduce<TermRow | null>((b, r) => ((r.change ?? 0) < (b?.change ?? 0) ? r : b), null);
  const items: [string, string, string, string?][] = [
    ['Best semester', two(best.gpa!), best.semester, 'good'],
    ['Toughest semester', two(worst.gpa!), worst.semester, worst.gpa! < 2 ? 'pen' : undefined],
    ['Biggest boost', up ? signed(up.change!) : 'None yet', up?.semester ?? '', 'good'],
    ['Biggest drop', down ? signed(down.change!) : 'Never dropped', down?.semester ?? '', down ? 'pen' : undefined],
  ];
  return (
    <section className="card" aria-labelledby="hl">
      <h2 id="hl">Highlights</h2>
      <ul className="facts">
        {items.map(([label, value, sem, tone]) => (
          <li key={label}><span>{label}</span><b className={tone}>{value}</b><em>{sem}</em></li>
        ))}
      </ul>
    </section>
  );
}

function Dashboard() {
  const store = useStore();
  const { totals: s, rows, valid, next, programInfo, needed } = store;
  const [custom, setCustom] = useState<LetterGrade>('B+');
  const [asTable, setAsTable] = useState(false);
  const cgpa = s.cgpa!;
  const standing = standingOf(rows, programInfo?.probation);
  const honour = honourOf(cgpa);
  const vc = rows.filter((r) => r.list === 'vc');
  const dean = rows.filter((r) => r.list === 'dean');
  const left = needed ? Math.max(0, needed - s.earned) : null;
  const pct = needed ? Math.min(100, Math.round((s.earned / needed) * 100)) : null;
  const allA = left ? projectedCgpa(s.sums, left, 4) : null;
  const plan = next ? scenarios(s.sums, candidates(valid, next, 'A'), 3).rules : null;
  const order = [...LETTER_GRADES, 'P', 'I', 'W'] as string[];
  const counts = [...gradeCounts([...s.counted.values()].map((a) => a.grade))].sort((x, y) => order.indexOf(x[0]) - order.indexOf(y[0]));

  return (
    <div className="stack">
      <section className="hero" aria-label="Your result">
        <div className="hero-main">
          <p className="hero-label">Your CGPA</p>
          <p className="hero-cgpa">{two(cgpa)}<span>/ 4.00</span></p>
          <div className="hero-pills">
            {standing && <span className={`pill ${standing.status === 'good' ? 'good' : 'pen'}`}>{STANDING[standing.status]}</span>}
            <span className="pill soft">{LEVEL[levelOf(s.earned)]}</span>
            {honour && <span className="pill soft">{HONOUR[honour]}</span>}
          </div>
        </div>
        <div className="hero-side">
          <div>
            <div className="hero-row"><span>Credits</span><b>{s.earned}{needed ? ` of ${needed}` : ''}</b></div>
            {pct !== null && <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={needed!} aria-valuenow={s.earned} aria-label="Credits earned"><span style={{ width: `${pct}%` }} /></div>}
          </div>
          <div className="hero-lists">
            <div><b>{vc.length}</b><span>VC's List</span></div>
            <div><b>{dean.length}</b><span>Dean's List</span></div>
          </div>
          {allA !== null && left! > 0 && <p className="hero-note">Straight A's from here would finish at <b>{two(allA)}</b>.</p>}
        </div>
      </section>

      <section className="actions" aria-label="What would you like to do?">
        <a href="#/repeat" className="action">
          <span className="action-icon"><Rise /></span>
          <span className="action-text">
            <b>Repeat or Retake</b>
            <span>{plan && plan.chosen.length ? `Your best ${count(plan.chosen.length, 'course')} could take you to ${two(plan.cgpa!)}.` : 'See which courses are worth taking again.'}</span>
          </span>
          <Arrow />
        </a>
        <a href="#/plan" className="action">
          <span className="action-icon"><Calendar /></span>
          <span className="action-text"><b>Plan next semester</b><span>Try the grades you expect before they happen.</span></span>
          <Arrow />
        </a>
        <a href="#/plan?target" onClick={(e) => { e.preventDefault(); sessionStorage.setItem('cgpa-analyzer:planTab', 'target'); go('plan'); }} className="action">
          <span className="action-icon"><Target /></span>
          <span className="action-text"><b>Reach a target</b><span>What 3.50, 3.80 or any CGPA would take.</span></span>
          <Arrow />
        </a>
      </section>

      <section className="card" aria-labelledby="trend">
        <div className="card-head">
          <h2 id="trend">Semester by semester</h2>
          <div className="row">
            <button type="button" className="btn btn-quiet btn-sm" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>{asTable ? 'Show the graph' : 'Show as a table'}</button>
            <button type="button" className="btn btn-quiet btn-sm no-print" onClick={() => window.print()}><Printer /> Print</button>
          </div>
        </div>
        {asTable ? (
          <div className="table-wrap">
            <table className="plain">
              <thead><tr><th scope="col">Semester</th><th scope="col" className="num">Credits</th><th scope="col" className="num">GPA</th><th scope="col" className="num">CGPA</th><th scope="col">List</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.semester}>
                    <th scope="row">{r.semester}</th>
                    <td className="num">{r.attempted}</td>
                    <td className="num">{r.gpa !== null ? two(r.gpa) : 'n/a'}</td>
                    <td className="num">{r.cgpa !== null ? two(r.cgpa) : 'n/a'}</td>
                    <td>{r.list ? <span className={`pill ${r.list === 'vc' ? 'navy' : 'good'}`}>{r.list === 'vc' ? "VC's List" : "Dean's List"}</span> : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Chart rows={rows} />}
      </section>

      <div className="two">
        <Highlights rows={rows} />
        <section className="card" aria-labelledby="gr">
          <h2 id="gr">Your grades</h2>
          <ul className="grade-counts">
            {counts.map(([g, n]) => <li key={g}><span>{g}</span><b>{n}</b></li>)}
          </ul>
          {vc.length + dean.length > 0 ? (
            <p className="muted small" style={{ marginTop: 12 }}>
              On a list: {rows.filter((r) => r.list).map((r) => `${r.semester} (${r.list === 'vc' ? 'VC' : 'Dean'}, ${two(r.gpa!)})`).join(', ')}.
            </p>
          ) : <p className="muted small" style={{ marginTop: 12 }}>No VC's or Dean's List yet: 12 credits at 3.70 or more gets you there.</p>}
        </section>
      </div>

      <section className="card" aria-labelledby="grad">
        <div className="card-head">
          <h2 id="grad">Your CGPA at graduation</h2>
          <div className="row">
            <label className="sr-only" htmlFor="program">Program</label>
            <select id="program" className="field inline" value={programInfo?.code ?? ''} onChange={(e) => store.setProgram(e.target.value || null)}>
              <option value="">Pick your program</option>
              {PROGRAMS.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="needed">Credits to graduate</label>
            <input id="needed" className="field mono" type="number" min={1} max={250} style={{ width: 90 }} value={needed ?? ''} placeholder="Credits"
              onChange={(e) => store.setTotal(e.target.value ? Math.max(1, Number(e.target.value)) : null)} />
          </div>
        </div>
        {left === null ? <p className="muted">Pick your program to see where your CGPA can finish.</p> : left <= 0 ? (
          <p className="muted">You have all {needed} credits. Your final CGPA is {two(cgpa)}, unless a Repeat or Retake changes it.</p>
        ) : (
          <>
            <p className="muted small">{left} credits to go. If they go like this, you graduate with:</p>
            <ul className="outcomes">
              {[
                ['Straight A (4.00)', projectedCgpa(s.sums, left, 4)],
                ['Half 4.00, half 3.70', projectedSplit(s.sums, left, 4, 3.7)],
                ['All A- (3.70)', projectedCgpa(s.sums, left, 3.7)],
                ['Same as your average so far', projectedCgpa(s.sums, left, s.exact!)],
              ].map(([label, v]) => {
                const band = honourOf(v as number);
                return <li key={label as string}><span>{label}</span><b>{two(v as number)}</b><em>{band ? HONOUR[band] : ''}</em></li>;
              })}
              <li>
                <span className="row" style={{ gap: 6 }}>All at
                  <select className="field inline mono" aria-label="Grade for every remaining course" value={custom} onChange={(e) => setCustom(e.target.value as LetterGrade)}>
                    {LETTER_GRADES.filter((g) => g !== 'F').map((g) => <option key={g}>{g}</option>)}
                  </select>
                </span>
                <b>{two(projectedCgpa(s.sums, left, GRADE_POINTS[custom])!)}</b>
                <em>{(() => { const b = honourOf(projectedCgpa(s.sums, left, GRADE_POINTS[custom])); return b ? HONOUR[b] : ''; })()}</em>
              </li>
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const { totals } = useStore();
  return totals.cgpa === null ? <Landing /> : <Dashboard />;
}
