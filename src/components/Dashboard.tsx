import { useState } from 'react';
import { honourOf, LETTER_GRADES, GRADE_POINTS, LetterGrade, projectedCgpa, projectedSplit } from '../engine/grades';
import { PROGRAMS } from '../engine/programs';
import { useLang } from '../i18n';
import { useStore } from '../store';

// The side panel on the overview: which program, how far through it, the
// semester lists, and where the CGPA lands at graduation under a few plans.
export default function Dashboard() {
  const { t, num, sem } = useLang();
  const store = useStore();
  const { totals: s, rows, programInfo, needed } = store;
  const [custom, setCustom] = useState<LetterGrade>('B+');
  if (s.cgpa === null || s.exact === null) return null;

  const vc = rows.filter((r) => r.list === 'vc');
  const dean = rows.filter((r) => r.list === 'dean');
  const total = needed ?? 0;
  const left = Math.max(0, total - s.earned);
  const pct = total ? Math.min(100, Math.round((s.earned / total) * 100)) : 0;
  const average = s.exact;
  const hasF = [...s.counted.values()].some((a) => a.grade === 'F');

  const outlook: { key: string; label: string; value: number | null }[] = [
    { key: 'all4', label: t('dash.all4'), value: projectedCgpa(s.sums, left, 4) },
    { key: 'half4', label: t('dash.half4', { avg: num(Math.round(average * 100) / 100, 2) }), value: projectedSplit(s.sums, left, 4, average) },
    { key: 'all37', label: t('dash.all37'), value: projectedCgpa(s.sums, left, 3.7) },
    { key: 'same', label: t('dash.same'), value: projectedCgpa(s.sums, left, average) },
    { key: 'custom', label: '', value: projectedCgpa(s.sums, left, GRADE_POINTS[custom]) },
  ];

  return (
    <aside className="stack dash" style={{ '--gap': '16px' } as React.CSSProperties} aria-label={t('dash.label')}>
      <section className="card" aria-labelledby="d-program">
        <h2 id="d-program" style={{ fontSize: '1.05rem' }}>{t('dash.program')}</h2>
        <label className="sr-only" htmlFor="program-pick">{t('dash.program')}</label>
        <select id="program-pick" className="field" style={{ marginTop: 8 }} value={programInfo?.code ?? ''}
          onChange={(e) => store.setProgram(e.target.value || null)}>
          <option value="">{t('dash.pickProgram')}</option>
          {PROGRAMS.map((p) => <option key={p.code} value={p.code}>{t(`programs.${p.code}`)}</option>)}
        </select>
        <div className="row" style={{ marginTop: 10, flexWrap: 'nowrap' }}>
          <label className="small" htmlFor="needed" style={{ fontWeight: 700, flex: 1 }}>{t('dash.needed')}</label>
          <input id="needed" className="field mono" type="number" min={1} max={250} style={{ width: 96 }} value={needed ?? ''}
            placeholder="136" onChange={(e) => store.setTotal(e.target.value ? Math.max(1, Number(e.target.value)) : null)} />
        </div>
        {needed ? (
          <>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={needed} aria-valuenow={s.earned}
              aria-label={t('dash.progressLabel', { earned: s.earned, needed })} style={{ marginTop: 12 }}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="small muted" style={{ marginTop: 6 }}>
              {left > 0 ? t('dash.left', { earned: s.earned, needed, left }) : t('dash.done', { earned: s.earned })}
            </p>
          </>
        ) : <p className="hint">{t('dash.neededHint')}</p>}
        {programInfo && programInfo.probation !== 3 && <p className="hint">{t('dash.probation2')}</p>}
      </section>

      <section className="card" aria-labelledby="d-lists">
        <h2 id="d-lists" style={{ fontSize: '1.05rem' }}>{t('dash.lists')}</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <div className="list-count vc">
            <b>{num(vc.length)}</b>
            <span>{t('dash.vc')}</span>
          </div>
          <div className="list-count dean">
            <b>{num(dean.length)}</b>
            <span>{t('dash.dean')}</span>
          </div>
        </div>
        {vc.length + dean.length > 0 ? (
          <ul className="list-sems">
            {rows.filter((r) => r.list).map((r) => (
              <li key={r.semester}>
                <span>{sem(r.semester)}</span>
                <span className="mono">{num(r.gpa!, 2)}</span>
                <span className={`tag ${r.list === 'vc' ? 'navy' : 'good'}`}>{r.list === 'vc' ? t('dash.vcShort') : t('dash.deanShort')}</span>
              </li>
            ))}
          </ul>
        ) : <p className="small muted" style={{ marginTop: 8 }}>{t('dash.noLists')}</p>}
        <p className="hint" style={{ marginTop: 8 }}>{t('dash.listRule')}</p>
      </section>

      <section className="card" aria-labelledby="d-outlook">
        <h2 id="d-outlook" style={{ fontSize: '1.05rem' }}>{t('dash.outlook')}</h2>
        {!needed ? <p className="small muted" style={{ marginTop: 6 }}>{t('dash.outlookNeeds')}</p> : left <= 0 ? (
          <p className="small muted" style={{ marginTop: 6 }}>{t('dash.outlookDone', { cgpa: num(s.cgpa, 2) })}</p>
        ) : (
          <>
            <p className="small muted" style={{ marginTop: 4 }}>{t('dash.outlookText', { left })}</p>
            <ul className="outlook">
              {outlook.map((o) => {
                const band = honourOf(o.value);
                return (
                  <li key={o.key}>
                    <span className="small" style={{ flex: 1 }}>
                      {o.key === 'custom' ? (
                        <label className="row" style={{ gap: 6 }}>
                          {t('dash.allAt')}
                          <select className="field mono" style={{ width: 'auto', minHeight: 32, padding: '2px 24px 2px 8px' }} value={custom} onChange={(e) => setCustom(e.target.value as LetterGrade)}>
                            {LETTER_GRADES.filter((g) => g !== 'F').map((g) => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </label>
                      ) : o.label}
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      <b className="mono" style={{ fontSize: '1.15rem' }}>{o.value !== null ? num(o.value, 2) : t('chart.none')}</b>
                      {band && <span className="small" style={{ display: 'block', color: 'var(--good)', fontWeight: 700 }}>{t(`honour.${band}`)}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="hint" style={{ marginTop: 8 }}>{t('dash.outlookNote')}{hasF ? ` ${t('dash.outlookF')}` : ''}</p>
          </>
        )}
      </section>
    </aside>
  );
}
