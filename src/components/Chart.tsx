import { useEffect, useRef, useState } from 'react';
import type { TermRow } from '../engine/grades';
import { useLang } from '../i18n';

const H = 300;
const PAD = { top: 34, right: 16, bottom: 34, left: 38 };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

// CGPA as a line, each semester's GPA as a bar behind it, and the lines that
// matter at BRACU: 2.00 for probation and 3.50 / 3.65 / 3.80 for distinction
export default function Chart({ rows }: { rows: TermRow[] }) {
  const { t, num, sem } = useLang();
  const [box, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const data = rows.filter((r) => r.cgpa !== null);
  if (data.length === 0) return null;

  const values = data.flatMap((r) => [r.cgpa!, r.gpa ?? r.cgpa!]);
  const low = Math.min(...values);
  const yMin = Math.max(0, Math.min(2, Math.floor((low - 0.25) * 2) / 2));
  const yMax = 4;
  const innerW = width - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = innerW / data.length;
  const x = (i: number) => PAD.left + step * i + step / 2;
  const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const barW = Math.min(34, step * 0.56);

  // ticks on whole and half points only
  const tickStep = yMax - yMin > 2.5 ? 1 : 0.5;
  const ticks: number[] = [];
  for (let v = Math.ceil(yMin / tickStep) * tickStep; v <= yMax + 1e-9; v += tickStep) ticks.push(Math.round(v * 100) / 100);
  const narrow = width < 520;
  const refs = [
    { v: 2, label: t('chart.probation'), color: 'var(--pen)' },
    { v: 3.5, label: t('chart.distinction'), color: 'var(--good)' },
    { v: 3.8, label: t('chart.highest'), color: 'var(--good)' },
  ].filter((r) => r.v > yMin && r.v < yMax);

  // the biggest move each way, for the red pen notes
  const moves = data.map((r, i) => ({ i, change: r.change ?? 0 }));
  const up = moves.reduce((b, m) => (m.change > b.change ? m : b), { i: -1, change: 0 });
  const down = moves.reduce((b, m) => (m.change < b.change ? m : b), { i: -1, change: 0 });

  const path = data.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r.cgpa!).toFixed(1)}`).join(' ');
  // label every semester if there is room, otherwise every second or third
  const every = Math.ceil(46 / step);
  const short = (name: string) => {
    const [term, year] = sem(name).split(' ');
    return `${term.slice(0, 3)} ${year.slice(-2)}`;
  };
  const note = (i: number, text: string, color: string, above: boolean) => {
    const cx = x(i);
    const cy = y(data[i].cgpa!);
    const tx = Math.min(Math.max(cx, PAD.left + 50), width - PAD.right - 50);
    const ty = above ? Math.max(cy - 22, 16) : Math.min(cy + 34, H - PAD.bottom - 4);
    return (
      <g aria-hidden="true">
        <ellipse cx={cx} cy={cy} rx={11} ry={9} fill="none" stroke={color} strokeWidth={1.8} transform={`rotate(-12 ${cx} ${cy})`} />
        <text x={tx} y={ty} textAnchor="middle" className="note" style={{ fill: color }}>{text}</text>
      </g>
    );
  };

  const a = active !== null ? data[active] : null;

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <svg className="chart" width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={t('chart.label', { from: sem(data[0].semester), to: sem(data[data.length - 1].semester), cgpa: num(data[data.length - 1].cgpa!, 2) })}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end">{num(v, v % 1 ? 1 : 0)}</text>
          </g>
        ))}
        {refs.map((r) => (
          <line key={r.v} x1={PAD.left} x2={width - PAD.right} y1={y(r.v)} y2={y(r.v)} stroke={r.color} strokeDasharray="5 5" strokeWidth={1.2} opacity={0.75} />
        ))}
        {data.map((r, i) => (r.gpa !== null ? (
          <rect key={r.semester} x={x(i) - barW / 2} y={y(r.gpa)} width={barW} height={Math.max(1, y(yMin) - y(r.gpa))} rx={4}
            fill={active === i ? 'var(--navy)' : 'var(--chart-bar)'} opacity={active === i ? 0.35 : 1} />
        ) : null))}
        {/* labels sit over the bars with a halo in the card colour so they stay readable */}
        {refs.map((r) => (
          <text key={r.v} x={width - PAD.right} y={y(r.v) - 5} textAnchor="end"
            style={{ fill: r.color, fontSize: 10, paintOrder: 'stroke', stroke: 'var(--sheet)', strokeWidth: 4, strokeLinejoin: 'round' }}>
            {num(r.v, 2)}{narrow ? '' : ` ${r.label}`}
          </text>
        ))}
        <path d={path} fill="none" stroke="var(--navy)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((r, i) => (
          <circle key={r.semester} cx={x(i)} cy={y(r.cgpa!)} r={active === i ? 6.5 : 4.5} fill="var(--sheet)" stroke="var(--navy)" strokeWidth={2.5} />
        ))}
        {up.i > 0 && up.change > 0 && note(up.i, t('chart.jump', { n: `+${num(up.change / 100, 2)}` }), 'var(--good)', true)}
        {down.i > 0 && down.change < 0 && note(down.i, t('chart.drop', { n: `−${num(-down.change / 100, 2)}` }), 'var(--pen)', false)}
        {data.map((r, i) => (i % every === 0 || i === data.length - 1) && (
          <text key={r.semester} x={x(i)} y={H - PAD.bottom + 18} textAnchor="middle">{short(r.semester)}</text>
        ))}
        {/* one focusable strip per semester, for the mouse and the keyboard alike */}
        {data.map((r, i) => (
          <rect key={`hit-${r.semester}`} x={PAD.left + step * i} y={PAD.top} width={step} height={innerH} fill="transparent"
            tabIndex={0} role="button" aria-label={t('chart.point', { sem: sem(r.semester), gpa: r.gpa !== null ? num(r.gpa, 2) : t('chart.none'), cgpa: num(r.cgpa!, 2) })}
            onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} style={{ outline: 'none', cursor: 'default' }} />
        ))}
      </svg>
      {a && active !== null && (
        <div role="status" className="card" style={{
          position: 'absolute', top: 4, left: Math.min(Math.max(x(active) - 90, 0), width - 180), width: 180, padding: '10px 12px',
          boxShadow: 'var(--shadow)', pointerEvents: 'none', fontSize: '0.86rem',
        }}>
          <b>{sem(a.semester)}</b>
          <div className="row spread"><span className="muted">{t('fig.gpa')}</span><span className="mono">{a.gpa !== null ? num(a.gpa, 2) : t('chart.none')}</span></div>
          <div className="row spread"><span className="muted">{t('fig.cgpa')}</span><span className="mono">{num(a.cgpa!, 2)}</span></div>
          {a.change !== null && a.change !== 0 && (
            <div className="row spread"><span className="muted">{t('chart.change')}</span><span className={`mono ${a.change > 0 ? 'up' : 'down'}`}>{a.change > 0 ? '+' : '−'}{num(Math.abs(a.change) / 100, 2)}</span></div>
          )}
        </div>
      )}
      <div className="legend" style={{ marginTop: 8 }}>
        <span><i style={{ background: 'var(--navy)', height: 3 }} />{t('chart.cgpaLine')}</span>
        <span><i style={{ background: 'var(--chart-bar)' }} />{t('chart.gpaBars')}</span>
        <span><i style={{ background: 'none', borderTop: '2px dashed var(--pen)', height: 0 }} />{t('chart.probationKey')}</span>
        <span><i style={{ background: 'none', borderTop: '2px dashed var(--good)', height: 0 }} />{t('chart.honoursKey')}</span>
      </div>
    </div>
  );
}
