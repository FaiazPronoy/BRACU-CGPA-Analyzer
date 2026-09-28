import { GRADE_POINTS, LETTER_GRADES, MARKS } from '../engine/grades';
import { useLang } from '../i18n';

const REMARK: Partial<Record<string, string>> = { 'A+': 'exceptional', A: 'excellent', B: 'good', C: 'fair', D: 'poor', F: 'failure' };

function Block({ id, children }: { id: string; children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <section className="card" aria-labelledby={`r-${id}`}>
      <h2 id={`r-${id}`}>{t(`rules.${id}.title`)}</h2>
      <div className="stack small" style={{ '--gap': '8px', marginTop: 8 } as React.CSSProperties}>{children}</div>
    </section>
  );
}

export default function Rules() {
  const { t, num } = useLang();
  const p = (key: string) => <p>{t(key)}</p>;

  return (
    <div className="stack" style={{ '--gap': '22px' } as React.CSSProperties}>
      <div>
        <p className="eyebrow">{t('rules.eyebrow')}</p>
        <h1 className="page-title">{t('rules.title')}</h1>
        <p className="lead">{t('rules.lead')}</p>
      </div>

      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <section className="card" aria-labelledby="scale">
          <h2 id="scale">{t('rules.scale')}</h2>
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table className="plain">
              <thead>
                <tr>
                  <th scope="col">{t('rules.grade')}</th>
                  <th scope="col">{t('rules.marks')}</th>
                  <th scope="col" className="num">{t('rules.points')}</th>
                  <th scope="col">{t('rules.remark')}</th>
                </tr>
              </thead>
              <tbody>
                {LETTER_GRADES.map((g) => {
                  const [lo, hi] = MARKS[g];
                  return (
                    <tr key={g}>
                      <th scope="row" className="mono">{g}</th>
                      <td>{g === 'A+' ? t('rules.rangeTop', { lo: num(lo) }) : g === 'F' ? t('rules.rangeBottom', { hi: num(hi) }) : t('rules.range', { lo: num(lo), hi: num(hi) })}</td>
                      <td className="num">{num(GRADE_POINTS[g], 1)}</td>
                      <td className="muted">{REMARK[g] ? t(`rules.remarks.${REMARK[g]}`) : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>{t('rules.aPlus')}</p>
          <p className="small muted" style={{ marginTop: 4 }}>{t('rules.noValue')}</p>
        </section>

        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Block id="formula">
            <p className="mono" style={{ padding: '10px 12px', background: 'var(--sunk)', borderRadius: 10 }}>{t('rules.formula.eq')}</p>
            {p('rules.formula.p1')}
            {p('rules.formula.p2')}
            <p className="hand" style={{ fontSize: '1.3rem' }}>{t('rules.formula.example')}</p>
          </Block>
          <Block id="retake">
            {p('rules.retake.p1')}
            {p('rules.retake.p2')}
          </Block>
          <Block id="repeat">
            {p('rules.repeat.p1')}
            {p('rules.repeat.p2')}
          </Block>
        </div>
      </div>

      <div className="grid cols-3" style={{ alignItems: 'start' }}>
        <Block id="pio">
          {p('rules.pio.p')}
          {p('rules.pio.i')}
          {p('rules.pio.w')}
          {p('rules.pio.remedial')}
        </Block>
        <Block id="probation">
          {p('rules.probation.p1')}
          {p('rules.probation.p2')}
          {p('rules.probation.old')}
        </Block>
        <Block id="deans">
          {p('rules.deans.p1')}
          {p('rules.deans.p2')}
        </Block>
        <Block id="honours">
          {p('rules.honours.p1')}
          {p('rules.honours.p2')}
        </Block>
        <Block id="levels">
          {p('rules.levels.p1')}
          {p('rules.levels.p2')}
        </Block>
        <Block id="graduate">
          {p('rules.graduate.p1')}
          {p('rules.graduate.p2')}
        </Block>
      </div>

      <p className="small muted">
        {t('rules.source')}{' '}
        <a href="https://www.bracu.ac.bd/academics/policies-and-procedures" target="_blank" rel="noreferrer">{t('rules.sourceLink')}</a>
        {' · '}
        <a href="https://www.bracu.ac.bd/academics/policies-and-procedures/academic-standings-and-honors" target="_blank" rel="noreferrer">{t('rules.sourceLink2')}</a>
      </p>
    </div>
  );
}
