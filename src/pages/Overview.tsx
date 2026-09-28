import { useState } from 'react';
import { go } from '../App';
import { Arrow, Empty, Printer } from '../components/bits';
import Chart from '../components/Chart';
import Dashboard from '../components/Dashboard';
import { honourOf, levelOf, standingOf, TermRow } from '../engine/grades';
import { useLang } from '../i18n';
import { useStore } from '../store';

const LEVEL_TOP: Record<string, number> = { freshman: 30, sophomore: 60, junior: 90, senior: 140 };

function Insight({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: 'good' | 'pen' }) {
  return (
    <div className="card">
      <p className="small muted" style={{ fontWeight: 700 }}>{label}</p>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.35rem', marginTop: 4, color: tone ? `var(--${tone})` : undefined }}>{value}</p>
      {detail && <p className="small muted" style={{ marginTop: 2 }}>{detail}</p>}
    </div>
  );
}

export default function Overview() {
  const { t, num, sem } = useLang();
  const { rows, totals: s, programInfo } = useStore();
  const [asTable, setAsTable] = useState(false);
  const graded = rows.filter((r) => r.gpa !== null);

  if (!graded.length || s.cgpa === null) {
    return <Empty title={t('overview.emptyTitle')} text={t('overview.emptyText')}
      action={<button type="button" className="btn btn-primary" onClick={() => go('grades')}>{t('overview.emptyBtn')} <Arrow /></button>} />;
  }

  const best = graded.reduce((b, r) => (r.gpa! > b.gpa! ? r : b));
  const worst = graded.reduce((b, r) => (r.gpa! < b.gpa! ? r : b));
  const moved = rows.filter((r) => r.change !== null);
  const up = moved.reduce<TermRow | null>((b, r) => (r.change! > (b?.change ?? 0) ? r : b), null);
  const down = moved.reduce<TermRow | null>((b, r) => (r.change! < (b?.change ?? 0) ? r : b), null);
  const standing = standingOf(rows, programInfo?.probation)!;
  const level = levelOf(s.earned);
  const honour = honourOf(s.cgpa);
  const signed = (hundredths: number) => `${hundredths > 0 ? '+' : '−'}${num(Math.abs(hundredths) / 100, 2)}`;

  return (
    <div className="stack" style={{ '--gap': '22px' } as React.CSSProperties}>
      <div className="row spread">
        <div>
          <p className="eyebrow">{t('overview.eyebrow')}</p>
          <h1 className="page-title">{t('overview.title')}</h1>
        </div>
        <button type="button" className="btn btn-line btn-sm no-print" onClick={() => window.print()}><Printer /> {t('overview.print')}</button>
      </div>

      <div className="with-aside">
        <div className="stack" style={{ '--gap': '22px' } as React.CSSProperties}>
      <section className="card" aria-labelledby="trend">
        <div className="row spread" style={{ marginBottom: 8 }}>
          <h2 id="trend">{t('overview.trend')}</h2>
          <button type="button" className="btn btn-quiet btn-sm no-print" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
            {asTable ? t('overview.asChart') : t('overview.asTable')}
          </button>
        </div>
        {asTable ? (
          <div className="table-wrap">
            <table className="plain">
              <caption className="sr-only">{t('overview.tableCaption')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('fig.semester')}</th>
                  <th scope="col" className="num">{t('fig.attempted')}</th>
                  <th scope="col" className="num">{t('fig.gpa')}</th>
                  <th scope="col" className="num">{t('fig.cgpa')}</th>
                  <th scope="col" className="num">{t('chart.change')}</th>
                  <th scope="col">{t('overview.listCol')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.semester}>
                    <th scope="row">{sem(r.semester)}</th>
                    <td className="num">{num(r.attempted)}</td>
                    <td className="num">{r.gpa !== null ? num(r.gpa, 2) : t('chart.none')}</td>
                    <td className="num">{r.cgpa !== null ? num(r.cgpa, 2) : t('chart.none')}</td>
                    <td className={`num ${r.change ? (r.change > 0 ? 'up' : 'down') : ''}`}>{r.change ? signed(r.change) : ''}</td>
                    <td>{r.list ? <span className={`tag ${r.list === 'vc' ? 'navy' : 'good'}`}>{r.list === 'vc' ? t('dash.vcShort') : t('dash.deanShort')}</span> : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Chart rows={rows} />
        )}
      </section>

      <div className="grid insights">
        <Insight label={t('overview.best')} value={`${num(best.gpa!, 2)}`} detail={sem(best.semester)} tone="good" />
        <Insight label={t('overview.worst')} value={`${num(worst.gpa!, 2)}`} detail={sem(worst.semester)} tone={worst.gpa! < 2 ? 'pen' : undefined} />
        <Insight label={t('overview.up')} value={up ? signed(up.change!) : t('chart.none')} detail={up ? sem(up.semester) : t('overview.noMove')} tone="good" />
        <Insight label={t('overview.down')} value={down ? signed(down.change!) : t('chart.none')} detail={down ? sem(down.semester) : t('overview.noDrop')} tone={down ? 'pen' : undefined} />
      </div>

      <div className="grid trio">
        <section className="card" aria-labelledby="standing">
          <h2 id="standing">{t('overview.standing')}</h2>
          <p style={{ marginTop: 8 }}>
            <span className={`tag ${standing.status === 'good' ? 'good' : 'pen'}`}>{t(`standing.${standing.status}`)}</span>
          </p>
          <p className="small muted" style={{ marginTop: 8 }}>
            {standing.status === 'good'
              ? t('overview.standingGood', { line: num(standing.threshold, 2) })
              : t('overview.standingBelow', { n: standing.semestersBelow, allowed: standing.allowed, line: num(standing.threshold, 2) })}
          </p>
          {standing.policy === 'before2022' && <p className="small muted" style={{ marginTop: 6 }}>{t('overview.oldPolicy')}</p>}
        </section>

        <section className="card" aria-labelledby="level">
          <h2 id="level">{t('overview.level')}</h2>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.35rem', marginTop: 6 }}>{t(`level.${level}`)}</p>
          <p className="small muted">
            {LEVEL_TOP[level] ? t('overview.toNextLevel', { n: LEVEL_TOP[level] + 1 - s.earned, next: t(`level.${Object.keys(LEVEL_TOP)[Object.keys(LEVEL_TOP).indexOf(level) + 1] ?? 'advancedSenior'}`) }) : t('overview.topLevel')}
          </p>
          <p className="small muted" style={{ marginTop: 6 }}>{t('overview.graduate', { n: Math.max(0, 120 - s.earned) })}</p>
        </section>

        <section className="card" aria-labelledby="honours">
          <h2 id="honours">{t('overview.honours')}</h2>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.35rem', marginTop: 6 }}>{honour ? t(`honour.${honour}`) : t('honour.none')}</p>
          <p className="small muted">{t('overview.honoursText')}</p>
          <button type="button" className="btn btn-quiet btn-sm no-print" style={{ marginTop: 8, paddingLeft: 0 }} onClick={() => go('plan')}>{t('overview.honoursPlan')} <Arrow /></button>
        </section>
      </div>


        </div>
        <Dashboard />
      </div>

      <div className="card sunk row spread no-print">
        <div style={{ flex: '1 1 300px' }}>
          <h2 style={{ fontSize: '1.15rem' }}>{t('overview.nextTitle')}</h2>
          <p className="small muted" style={{ marginTop: 4 }}>{t('overview.nextText')}</p>
        </div>
        <button type="button" className="btn btn-pen" onClick={() => go('boost')}>{t('overview.nextBtn')} <Arrow /></button>
      </div>
    </div>
  );
}
