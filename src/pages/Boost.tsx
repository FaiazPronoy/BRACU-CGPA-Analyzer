import { useEffect, useMemo, useState } from 'react';
import { go } from '../App';
import { Arrow, Empty } from '../components/bits';
import { Candidate, candidates, cgpaWithGains, gainFor, Plan, scenarios } from '../engine/boost';
import { GRADE_POINTS, LetterGrade, semesterIndex, semesterName } from '../engine/grades';
import { useLang } from '../i18n';
import { useStore } from '../store';

const HOPES: LetterGrade[] = ['A', 'A-', 'B+', 'B'];
const MAX_LOAD = 15; // credits in one semester without special approval

function Scenario({ id, plan, count, now, best }: { id: 'retakes' | 'rules' | 'permission'; plan: Plan; count: number; now: number; best: boolean }) {
  const { t, num } = useLang();
  const change = plan.cgpa !== null ? Math.round((plan.cgpa - now) * 100) : 0;
  const credits = plan.chosen.reduce((n, c) => n + c.attempt.credits, 0);
  return (
    <section className={`card scenario${best ? ' best' : ''}`} aria-labelledby={`sc-${id}`}>
      <div className="row spread">
        <h2 id={`sc-${id}`} style={{ fontSize: '1.08rem' }}>{t(`boost.${id}`)}</h2>
        {best && <span className="tag navy">{t('boost.recommended')}</span>}
      </div>
      <p className="small muted">{t(`boost.${id}Text`)}</p>
      {plan.chosen.length === 0 ? (
        <p className="small" style={{ fontWeight: 700 }}>{t(id === 'retakes' ? 'boost.noRetakes' : 'boost.nothingHere')}</p>
      ) : (
        <>
          <p>
            <span className="big-number">{num(plan.cgpa!, 2)}</span>{' '}
            {change > 0 && <span className="tag good mono">+{num(change / 100, 2)}</span>}
          </p>
          {plan.chosen.length < count && <p className="small" style={{ color: 'var(--warn)', fontWeight: 700 }}>{t('boost.onlyN', { n: plan.chosen.length })}</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {plan.chosen.map((c) => (
              <li key={c.attempt.id} className="row spread small" style={{ padding: '4px 0', borderTop: '1px dashed var(--line)' }}>
                <span><span className="code">{c.attempt.code}</span> <span className="muted">{c.attempt.grade}</span></span>
                <span className="tag">{t(`kind.${c.kind}`)}</span>
              </li>
            ))}
          </ul>
          {credits > MAX_LOAD && <p className="small muted">{t('boost.overLoad', { credits })}</p>}
        </>
      )}
    </section>
  );
}

function statusOf(c: Candidate, t: (k: string, v?: Record<string, string | number>) => string, sem: (s: string) => string) {
  if (c.allowed === 'yes') return { tone: 'good', text: c.kind === 'retake' ? t('status.retakeOk') : t('status.repeatBy', { sem: sem(c.lastChance!) }) };
  if (c.allowed === 'permission') return { tone: 'warn', text: t(`status.${c.why}`) };
  return { tone: 'pen', text: t('status.repeatedOnce') };
}

export default function Boost() {
  const { t, num, sem } = useLang();
  const store = useStore();
  const { valid, totals: s, next } = store;
  const [count, setCount] = useState(3);
  const [hope, setHope] = useState<LetterGrade>('A');
  const [picked, setPicked] = useState<Record<string, LetterGrade | undefined>>({});
  const [showAll, setShowAll] = useState(false);

  // courses already at A- or better are not worth taking again, so they stay out of every list
  const all = useMemo(() => (next ? candidates(valid, next, hope).filter((c) => GRADE_POINTS[c.attempt.grade as LetterGrade] < 3.7) : []), [valid, next, hope]);
  const allowedCount = all.filter((c) => c.allowed !== 'no').length;
  const max = Math.max(1, Math.min(10, allowedCount));
  useEffect(() => {
    if (count > max) setCount(max);
  }, [count, max]);

  if (s.cgpa === null || !next) {
    return <Empty title={t('overview.emptyTitle')} text={t('boost.emptyText')}
      action={<button type="button" className="btn btn-primary" onClick={() => go('grades')}>{t('overview.emptyBtn')} <Arrow /></button>} />;
  }

  const plans = scenarios(s.sums, all, count);
  const now = s.cgpa;
  const bestId = plans.rules.chosen.length ? 'rules' : plans.permission.chosen.length ? 'permission' : 'retakes';
  const nextOptions = [0, 1, 2, 3].map((i) => semesterName(semesterIndex(store.latest!) + 1 + i));

  // your own pick: any course that is allowed at all, each with its own hoped-for grade
  const chosen = all.filter((c) => c.allowed !== 'no' && picked[c.attempt.id]);
  const mine = cgpaWithGains(s.sums, chosen.map((c) => gainFor(c.attempt, picked[c.attempt.id]!)));
  const steps = Math.max(plans.rules.steps.length, plans.permission.steps.length);

  return (
    <div className="stack" style={{ '--gap': '22px' } as React.CSSProperties}>
      <div>
        <p className="eyebrow">{t('boost.eyebrow')}</p>
        <h1 className="page-title">{t('boost.title')}</h1>
        <p className="lead">{t('boost.lead')}</p>
      </div>

      {all.length === 0 ? (
        <div className="notice good"><p><b>{t('boost.allTop')}</b> {t('boost.allTopText', { grade: hope })}</p></div>
      ) : null}

      <section className="card sunk" aria-label={t('boost.controls')}>
        <div className="grid cols-3" style={{ alignItems: 'end' }}>
          <div>
            <span className="label" id="count-label">{t('boost.howMany')}</span>
            <div className="stepper" role="group" aria-labelledby="count-label">
              <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} aria-label={t('boost.fewer')}>{'−'}</button>
              <output aria-live="polite">{num(count)}</output>
              <button type="button" onClick={() => setCount((c) => Math.min(max, c + 1))} disabled={count >= max} aria-label={t('boost.more')}>+</button>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="hope">{t('boost.ifIGet')}</label>
            <select id="hope" className="field mono" value={hope} onChange={(e) => setHope(e.target.value as LetterGrade)}>
              {HOPES.map((g) => <option key={g} value={g}>{g} ({num(GRADE_POINTS[g], 1)})</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="next">{t('boost.planningFor')}</label>
            <select id="next" className="field" value={next} onChange={(e) => store.setNext(e.target.value)}>
              {nextOptions.map((n) => <option key={n} value={n}>{sem(n)}</option>)}
            </select>
          </div>
        </div>
        <p className="hint" style={{ marginTop: 10 }}>{t('boost.windowHint', { sem: sem(next) })}</p>
      </section>

      <div>
        <p className="small muted" style={{ marginBottom: 10 }}>{t('boost.now', { cgpa: num(now, 2) })}</p>
        <div className="grid cols-3">
          <Scenario id="rules" plan={plans.rules} count={count} now={now} best={bestId === 'rules'} />
          <Scenario id="permission" plan={plans.permission} count={count} now={now} best={bestId === 'permission'} />
          <Scenario id="retakes" plan={plans.retakes} count={count} now={now} best={bestId === 'retakes'} />
        </div>
      </div>

      {steps > 1 && (
        <section className="card" aria-labelledby="steps">
          <h2 id="steps">{t('boost.stepsTitle')}</h2>
          <p className="small muted" style={{ marginTop: 4 }}>{t('boost.stepsText')}</p>
          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="plain">
              <thead>
                <tr>
                  <th scope="col">{t('boost.courses')}</th>
                  <th scope="col" className="num">{t('boost.rules')}</th>
                  <th scope="col" className="num">{t('boost.permission')}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: steps }, (_, i) => (
                  <tr key={i}>
                    <th scope="row">{num(i + 1)}</th>
                    <td className="num">{plans.rules.steps[i]?.cgpa != null ? num(plans.rules.steps[i].cgpa!, 2) : t('chart.none')}</td>
                    <td className="num">{plans.permission.steps[i]?.cgpa != null ? num(plans.permission.steps[i].cgpa!, 2) : t('chart.none')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {all.length > 0 && (
        <section className="card" aria-labelledby="pick">
          <div className="row spread">
            <div>
              <h2 id="pick">{t('boost.pickTitle')}</h2>
              <p className="small muted" style={{ marginTop: 4 }}>{t('boost.pickText')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="small muted">{t('boost.yourPick', { n: chosen.length })}</p>
              <p className="big-number" style={{ fontSize: '2rem' }} aria-live="polite">{num(mine.cgpa ?? now, 2)}</p>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            {all.filter((c, i) => showAll || i < 8 || picked[c.attempt.id]).map((c) => {
              const st = statusOf(c, t, sem);
              const on = !!picked[c.attempt.id];
              const alone = cgpaWithGains(s.sums, [gainFor(c.attempt, picked[c.attempt.id] ?? hope)]).cgpa!;
              return (
                <div key={c.attempt.id} className="check-row" style={{ opacity: c.allowed === 'no' ? 0.6 : 1 }}>
                  <input type="checkbox" id={`p-${c.attempt.id}`} checked={on} disabled={c.allowed === 'no'}
                    onChange={() => setPicked((p) => ({ ...p, [c.attempt.id]: on ? undefined : hope }))} />
                  <span className="code">{c.attempt.code}</span>
                  <label htmlFor={`p-${c.attempt.id}`} style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700 }}>
                      <span className="sr-only">{c.attempt.code} </span>{c.attempt.title || c.attempt.code}
                    </span>
                    <span className="small muted">
                      {t('boost.line', { grade: c.attempt.grade, sem: sem(c.attempt.semester), credits: c.attempt.credits })}{' '}
                      <span className={`tag ${st.tone}`}>{st.text}</span>
                    </span>
                  </label>
                  <span className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                    {on && (
                      <select className="field mono" style={{ width: 'auto', minHeight: 34, padding: '2px 26px 2px 8px' }} aria-label={t('boost.gradeFor', { code: c.attempt.code })}
                        value={picked[c.attempt.id]} onChange={(e) => setPicked((p) => ({ ...p, [c.attempt.id]: e.target.value as LetterGrade }))}>
                        {HOPES.filter((g) => GRADE_POINTS[g] > GRADE_POINTS[c.attempt.grade as LetterGrade]).map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    )}
                    <span className="mono small" title={t('boost.aloneTitle')}>{num(alone, 2)}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            {all.length > 8 && (
              <button type="button" className="btn btn-line btn-sm" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
                {showAll ? t('boost.showFewer') : t('boost.showAll', { n: all.length })}
              </button>
            )}
            {chosen.length > 0 && <button type="button" className="btn btn-quiet btn-sm" onClick={() => setPicked({})}>{t('boost.clearPick')}</button>}
          </div>
        </section>
      )}

      <section className="card sunk" aria-labelledby="rules-note">
        <h2 id="rules-note" style={{ fontSize: '1.05rem' }}>{t('boost.policyTitle')}</h2>
        <ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          <li>{t('boost.policyRetake')}</li>
          <li>{t('boost.policyRepeat')}</li>
          <li>{t('boost.policyCredits')}</li>
          <li>{t('boost.policyCheck')}</li>
        </ul>
      </section>
    </div>
  );
}
