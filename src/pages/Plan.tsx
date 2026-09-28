import { useState } from 'react';
import { Plus, Trash } from '../components/bits';
import { go } from '../App';
import { Candidate, candidates } from '../engine/boost';
import { add, gpaOf, GRADE_POINTS, LETTER_GRADES, LetterGrade, neededGpa, Sums } from '../engine/grades';
import { planTarget } from '../engine/targets';
import { useLang } from '../i18n';
import { useStore } from '../store';

interface Row {
  key: number;
  credits: number;
  grade: LetterGrade;
}
let keys = 0;
const newRow = (grade: LetterGrade = 'A-'): Row => ({ key: keys++, credits: 3, grade });
const CREDITS = [1, 1.5, 2, 3, 4];

// the GPA needed, rounded up: a "need 3.61" that is really 3.6049 must not read as 3.60
const ceil2 = (v: number) => Math.ceil(v * 100 - 1e-9) / 100;

function NextSemester({ sums }: { sums: Sums }) {
  const { t, num } = useLang();
  const [rows, setRows] = useState<Row[]>(() => [newRow(), newRow(), newRow(), newRow()]);
  const set = (key: number, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const term = rows.reduce((s, r) => add(s, r.grade, r.credits), { points: 0, credits: 0 });
  const after = gpaOf(rows.reduce((s, r) => add(s, r.grade, r.credits), sums));
  const before = gpaOf(sums);
  const credits = rows.reduce((n, r) => n + r.credits, 0);
  const change = before !== null && after !== null ? Math.round((after - before) * 100) : 0;

  return (
    <section className="card" aria-labelledby="next-title">
      <h2 id="next-title">{t('plan.nextTitle')}</h2>
      <p className="small muted" style={{ marginTop: 4 }}>{t('plan.nextText')}</p>
      <div className="stack" style={{ '--gap': '8px', marginTop: 12 } as React.CSSProperties}>
        {rows.map((r, i) => (
          <div key={r.key} className="row" style={{ flexWrap: 'nowrap' }}>
            <span className="mono small muted" style={{ width: 22 }}>{num(i + 1)}</span>
            <label className="sr-only" htmlFor={`nc-${r.key}`}>{t('plan.creditsFor', { n: i + 1 })}</label>
            <select id={`nc-${r.key}`} className="field mono" value={r.credits} onChange={(e) => set(r.key, { credits: Number(e.target.value) })}>
              {CREDITS.map((c) => <option key={c} value={c}>{t('plan.credits', { n: c })}</option>)}
            </select>
            <label className="sr-only" htmlFor={`ng-${r.key}`}>{t('plan.gradeFor', { n: i + 1 })}</label>
            <select id={`ng-${r.key}`} className="field mono" value={r.grade} onChange={(e) => set(r.key, { grade: e.target.value as LetterGrade })}>
              {LETTER_GRADES.map((g) => <option key={g} value={g}>{g} ({num(GRADE_POINTS[g], 1)})</option>)}
            </select>
            <button type="button" className="icon-btn" aria-label={t('plan.removeRow', { n: i + 1 })} disabled={rows.length <= 1} onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))}><Trash /></button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-quiet btn-sm" style={{ marginTop: 8 }} disabled={rows.length >= 7} onClick={() => setRows((x) => [...x, newRow()])}><Plus /> {t('plan.addRow')}</button>
      <div className="grid cols-3" style={{ marginTop: 14 }}>
        <div className="card sunk"><p className="small muted">{t('plan.termGpa')}</p><p className="big-number" style={{ fontSize: '1.8rem' }}>{num(gpaOf(term) ?? 0, 2)}</p></div>
        <div className="card sunk">
          <p className="small muted">{before !== null ? t('plan.newCgpa') : t('plan.firstCgpa')}</p>
          <p className="big-number" style={{ fontSize: '1.8rem' }} aria-live="polite">
            {num(after ?? 0, 2)} {change !== 0 && <span className={`tag mono ${change > 0 ? 'good' : 'pen'}`}>{change > 0 ? '+' : '−'}{num(Math.abs(change) / 100, 2)}</span>}
          </p>
        </div>
        <div className="card sunk"><p className="small muted">{t('plan.load')}</p><p className="big-number" style={{ fontSize: '1.8rem' }}>{num(credits)}</p>
          {credits > 15 && <p className="small" style={{ color: 'var(--warn)', fontWeight: 700 }}>{t('plan.overLoad')}</p>}
          {credits < 9 && <p className="small muted">{t('plan.underLoad')}</p>}
        </div>
      </div>
    </section>
  );
}

function Target({ sums, earned, needed, byRules, withPermission }: { sums: Sums; earned: number; needed: number | null; byRules: Candidate[]; withPermission: Candidate[] }) {
  const { t, num } = useLang();
  const now = gpaOf(sums);
  const [target, setTarget] = useState(() => Math.min(4, Math.max(2, Math.ceil(((now ?? 3) + 0.1) * 20) / 20)));
  const [program, setProgram] = useState(needed ?? 136);
  const [left, setLeft] = useState(() => Math.max(0, (needed ?? 136) - earned));
  const need = neededGpa(sums, target, left);
  const verdict = need === null ? null : need > 4 ? 'out' : need <= 0 ? 'there' : now !== null && need <= now ? 'easy' : 'push';
  const semesters = Math.ceil(left / 15);

  return (
    <section className="card" aria-labelledby="target-title">
      <h2 id="target-title">{t('plan.targetTitle')}</h2>
      <p className="small muted" style={{ marginTop: 4 }}>{t('plan.targetText')}</p>
      <div className="row" style={{ marginTop: 10 }}>
        {[2, 3.5, 3.65, 3.8].map((v) => (
          <button key={v} type="button" className="btn btn-line btn-sm" aria-pressed={target === v} onClick={() => setTarget(v)}>
            {num(v, 2)} <span className="muted small">{t(`plan.band_${String(v).replace('.', '_')}`)}</span>
          </button>
        ))}
      </div>
      <div className="grid cols-3" style={{ marginTop: 12 }}>
        <div>
          <label className="label" htmlFor="target">{t('plan.target')}</label>
          <input id="target" className="field mono" type="number" min={1} max={4} step={0.01} value={target} onChange={(e) => setTarget(Math.min(4, Math.max(0, Number(e.target.value) || 0)))} />
        </div>
        <div>
          <label className="label" htmlFor="program">{t('plan.program')}</label>
          <input id="program" className="field mono" type="number" min={120} max={220} value={program}
            onChange={(e) => { const p = Number(e.target.value) || 0; setProgram(p); setLeft(Math.max(0, p - earned)); }} />
          <p className="hint">{t('plan.programHint')}</p>
        </div>
        <div>
          <label className="label" htmlFor="left">{t('plan.left')}</label>
          <input id="left" className="field mono" type="number" min={0} max={220} value={left} onChange={(e) => setLeft(Math.max(0, Number(e.target.value) || 0))} />
          <p className="hint">{t('plan.leftHint', { n: earned })}</p>
        </div>
      </div>
      {(() => {
        if (now !== null && now >= target && (left === 0 || verdict === 'there')) {
          return <div className="notice good" style={{ marginTop: 14 }}><p>{t('plan.alreadyThere', { target: num(target, 2) })}</p></div>;
        }
        const plan = planTarget(sums, left, target, byRules);
        const gp = (g: LetterGrade) => `${g} (${num(GRADE_POINTS[g], 2)})`;
        if (plan.reachable) {
          return (
            <div style={{ marginTop: 14 }}>
              {need !== null && verdict && (
                <div className={`notice ${verdict === 'push' ? '' : 'good'}`} style={{ display: 'block' }}>
                  <p className="small muted">{t('plan.youNeed', { credits: left })}</p>
                  <p className="big-number">{num(Math.max(0, ceil2(need)), 2)}</p>
                  <p style={{ marginTop: 4 }}>{t(`plan.verdict_${verdict}`, { target: num(target, 2), n: semesters })}</p>
                </div>
              )}
              <h3 style={{ marginTop: 16 }}>{t('plan.waysTitle', { n: plan.courses.length })}</h3>
              <ul className="ways">
                {plan.mixes.map((m) => (
                  <li key={`${m.high}${m.highCourses}${m.low}`}>
                    <span>
                      {m.lowCourses === 0
                        ? t('plan.wayAll', { n: m.highCourses, grade: gp(m.high) })
                        : t(m.highCourses === 1 ? 'plan.wayMixOne' : 'plan.wayMix', { high: m.highCourses, hg: gp(m.high), low: m.lowCourses, lg: gp(m.low) })}
                    </span>
                    <b className="mono">{num(m.cgpa, 2)}</b>
                  </li>
                ))}
              </ul>
              <p className="hint">{t('plan.waysNote')}</p>
            </div>
          );
        }
        // not with new courses alone: look for repeats, by the rules first, then with permission
        const strict = planTarget(sums, left, target, byRules);
        const loose = strict.repeats ? strict : planTarget(sums, left, target, withPermission);
        const fix = strict.repeats ?? loose.repeats;
        const needsPermission = !strict.repeats && !!loose.repeats;
        const best = Math.max(strict.best ?? 0, loose.best ?? 0, plan.allFour ?? 0);
        return (
          <div style={{ marginTop: 14 }}>
            <div className="notice warn" style={{ display: 'block' }}>
              <p style={{ fontWeight: 800 }}>{t('plan.notPossible', { target: num(target, 2) })}</p>
              <p className="small" style={{ marginTop: 4 }}>
                {left > 0 ? t('plan.notPossibleText', { n: plan.courses.length, cgpa: num(plan.allFour ?? 0, 2) }) : t('plan.noneLeftText')}
              </p>
            </div>
            {fix ? (
              <div className="card sunk" style={{ marginTop: 12 }}>
                <h3>{t('plan.fixTitle', { n: fix.chosen.length })}</h3>
                <p className="small muted" style={{ marginTop: 4 }}>
                  {left > 0 ? t('plan.fixText', { n: plan.courses.length }) : t('plan.fixTextNoLeft')}
                </p>
                <ul className="ways">
                  {fix.chosen.map((c) => (
                    <li key={c.attempt.id}>
                      <span><span className="code">{c.attempt.code}</span> <span className="muted small">{c.attempt.grade} {'\u2192'} A</span>
                        {c.allowed === 'permission' && <span className="tag warn" style={{ marginLeft: 6 }}>{t('status.permissionShort')}</span>}</span>
                      <span className="small muted">{t(`kind.${c.kind}`)}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: 8 }}>{t('plan.fixResult')} <b className="mono" style={{ fontSize: '1.2rem' }}>{num(fix.cgpa ?? 0, 2)}</b></p>
                {needsPermission && <p className="hint">{t('plan.fixPermission')}</p>}
                <button type="button" className="btn btn-line btn-sm no-print" style={{ marginTop: 8 }} onClick={() => go('boost')}>{t('plan.fixOpen')}</button>
              </div>
            ) : (
              <p style={{ marginTop: 12 }}>{t('plan.lower', { best: num(best, 2) })}</p>
            )}
          </div>
        );
      })()}
      {left === 0 && <p className="hint" style={{ marginTop: 10 }}>{t('plan.noneLeft')}</p>}
    </section>
  );
}

// for someone without their transcript at hand: a CGPA is already rounded,
// so this is an estimate, and the page says so
function Quick() {
  const { t, num } = useLang();
  const [cgpa, setCgpa] = useState(3.2);
  const [credits, setCredits] = useState(60);
  const [gpa, setGpa] = useState(3.5);
  const [termCredits, setTermCredits] = useState(12);
  const [old, setOld] = useState<LetterGrade>('C');
  const [fresh, setFresh] = useState<LetterGrade>('A');
  const [oldCredits, setOldCredits] = useState(3);

  const valid = credits > 0 && cgpa >= 0 && cgpa <= 4;
  const afterTerm = valid ? (cgpa * credits + gpa * termCredits) / (credits + termCredits) : null;
  // a repeat or retake swaps the grade and keeps the credits
  const afterRetake = valid ? (cgpa * credits - GRADE_POINTS[old] * oldCredits + GRADE_POINTS[fresh] * oldCredits) / credits : null;
  const shown = (v: number | null) => (v === null ? t('chart.none') : num(Math.min(4, Math.max(0, Math.round(v * 100) / 100)), 2));

  return (
    <section className="card" aria-labelledby="quick-title">
      <h2 id="quick-title">{t('plan.quickTitle')}</h2>
      <p className="small muted" style={{ marginTop: 4 }}>{t('plan.quickText')}</p>
      <div className="grid cols-2" style={{ marginTop: 12 }}>
        <div>
          <label className="label" htmlFor="q-cgpa">{t('plan.qCgpa')}</label>
          <input id="q-cgpa" className="field mono" type="number" min={0} max={4} step={0.01} value={cgpa} onChange={(e) => setCgpa(Number(e.target.value))} />
        </div>
        <div>
          <label className="label" htmlFor="q-credits">{t('plan.qCredits')}</label>
          <input id="q-credits" className="field mono" type="number" min={1} max={220} value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
          <p className="hint">{t('plan.qCreditsHint')}</p>
        </div>
      </div>
      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card sunk">
          <h3>{t('plan.qTermTitle')}</h3>
          <div className="row" style={{ marginTop: 8, flexWrap: 'nowrap' }}>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="q-gpa">{t('plan.qGpa')}</label>
              <input id="q-gpa" className="field mono" type="number" min={0} max={4} step={0.01} value={gpa} onChange={(e) => setGpa(Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="q-tc">{t('plan.qTermCredits')}</label>
              <input id="q-tc" className="field mono" type="number" min={1} max={24} value={termCredits} onChange={(e) => setTermCredits(Number(e.target.value))} />
            </div>
          </div>
          <p style={{ marginTop: 10 }}>{t('plan.qBecomes')} <b className="mono" style={{ fontSize: '1.3rem' }}>{shown(afterTerm)}</b></p>
        </div>
        <div className="card sunk">
          <h3>{t('plan.qRetakeTitle')}</h3>
          <div className="row" style={{ marginTop: 8, flexWrap: 'nowrap' }}>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="q-old">{t('plan.qOld')}</label>
              <select id="q-old" className="field mono" value={old} onChange={(e) => setOld(e.target.value as LetterGrade)}>
                {LETTER_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="q-new">{t('plan.qNew')}</label>
              <select id="q-new" className="field mono" value={fresh} onChange={(e) => setFresh(e.target.value as LetterGrade)}>
                {LETTER_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="q-oc">{t('plan.qOldCredits')}</label>
              <input id="q-oc" className="field mono" type="number" min={1} max={6} value={oldCredits} onChange={(e) => setOldCredits(Number(e.target.value))} />
            </div>
          </div>
          <p style={{ marginTop: 10 }}>{t('plan.qBecomes')} <b className="mono" style={{ fontSize: '1.3rem' }}>{shown(afterRetake)}</b></p>
        </div>
      </div>
      <p className="hint" style={{ marginTop: 10 }}>{t('plan.quickNote')}</p>
    </section>
  );
}

export default function Plan() {
  const { t } = useLang();
  const { totals: s, needed, valid, next } = useStore();
  // biggest gains first; courses already at A or A+ have nothing to gain and are left out
  const pool = next ? candidates(valid, next, 'A') : [];
  const byRules = pool.filter((c) => c.allowed === 'yes');
  const withPermission = pool.filter((c) => c.allowed !== 'no');
  const has = s.cgpa !== null;
  return (
    <div className="stack" style={{ '--gap': '22px' } as React.CSSProperties}>
      <div>
        <p className="eyebrow">{t('plan.eyebrow')}</p>
        <h1 className="page-title">{t('plan.title')}</h1>
        <p className="lead">{has ? t('plan.lead') : t('plan.leadEmpty')}</p>
      </div>
      {has && <NextSemester sums={s.sums} />}
      {has && <Target sums={s.sums} earned={s.earned} needed={needed} byRules={byRules} withPermission={withPermission} />}
      <Quick />
    </div>
  );
}
