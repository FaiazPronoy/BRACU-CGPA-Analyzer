import { useEffect, useRef, useState } from 'react';
import type { TermRow } from '../engine/grades';
import { signed, two } from '../format';

const H = 280;
const PAD = { top: 30, right: 14, bottom: 32, left: 34 };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

const short = (name: string) => `${name.slice(0, 3)} ${name.slice(-2)}`;

// CGPA as a line over each semester's GPA as a bar, the 2.00 probation line,
// and the biggest rise and fall marked in red pen
export default function Chart({ rows }: { rows: TermRow[] }) {
  const [box, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const data = rows.filter((r) => r.cgpa !== null);
  if (!data.length) return null;

  const low = Math.min(...data.flatMap((r) => [r.cgpa!, r.gpa ?? r.cgpa!]));
  const yMin = Math.max(0, Math.min(2, Math.floor((low - 0.25) * 2) / 2));
  const innerW = width - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = innerW / data.length;
  const x = (i: number) => PAD.left + step * i + step / 2;
  const y = (v: number) => PAD.top + innerH - ((v - yMin) / (4 - yMin)) * innerH;
  const barW = Math.min(28, step * 0.5);
  const tick = 4 - yMin > 2.5 ? 1 : 0.5;
  const ticks: number[] = [];
  for (let v = Math.ceil(yMin / tick) * tick; v <= 4 + 1e-9; v += tick) ticks.push(Math.round(v * 100) / 100);
  const every = Math.ceil(44 / step);
  const up = data.reduce((b, r, i) => ((r.change ?? 0) > b.c ? { i, c: r.change! } : b), { i: -1, c: 0 });
  const down = data.reduce((b, r, i) => ((r.change ?? 0) < b.c ? { i, c: r.change! } : b), { i: -1, c: 0 });
  const path = data.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r.cgpa!).toFixed(1)}`).join(' ');
  const note = (i: number, text: string, color: string, above: boolean) => {
    const cx = x(i);
    const cy = y(data[i].cgpa!);
    return (
      <g aria-hidden="true">
        <ellipse cx={cx} cy={cy} rx={11} ry={9} fill="none" stroke={color} strokeWidth={1.8} transform={`rotate(-12 ${cx} ${cy})`} />
        <text x={Math.min(Math.max(cx, PAD.left + 50), width - PAD.right - 50)} y={above ? Math.max(cy - 20, 16) : Math.min(cy + 32, H - PAD.bottom - 4)}
          textAnchor="middle" className="note" style={{ fill: color }}>{text}</text>
      </g>
    );
  };
  const a = active !== null ? data[active] : null;

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <svg className="chart" width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img"
        aria-label={`CGPA from ${data[0].semester} to ${data[data.length - 1].semester}, now ${two(data[data.length - 1].cgpa!)}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end">{v % 1 ? v.toFixed(1) : v}</text>
          </g>
        ))}
        {yMin < 2 && <line x1={PAD.left} x2={width - PAD.right} y1={y(2)} y2={y(2)} stroke="var(--pen)" strokeDasharray="5 5" opacity={0.7} />}
        {data.map((r, i) => r.gpa !== null && (
          <rect key={r.semester} x={x(i) - barW / 2} y={y(r.gpa)} width={barW} height={Math.max(1, y(yMin) - y(r.gpa))} rx={6}
            fill={active === i ? 'var(--navy)' : 'var(--bar)'} opacity={active === i ? 0.3 : 1} />
        ))}
        <path d={path} fill="none" stroke="var(--navy)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((r, i) => <circle key={r.semester} cx={x(i)} cy={y(r.cgpa!)} r={active === i ? 6.5 : 4.5} fill="var(--card)" stroke="var(--navy)" strokeWidth={2.5} />)}
        {up.i > 0 && note(up.i, `${signed(up.c)} best jump`, 'var(--good)', true)}
        {down.i > 0 && note(down.i, `${signed(down.c)} biggest drop`, 'var(--pen)', false)}
        {data.map((r, i) => (i % every === 0 || i === data.length - 1) && (
          <text key={`x${r.semester}`} x={x(i)} y={H - PAD.bottom + 18} textAnchor="middle">{short(r.semester)}</text>
        ))}
        {data.map((r, i) => (
          <rect key={`h${r.semester}`} x={PAD.left + step * i} y={PAD.top} width={step} height={innerH} fill="transparent" tabIndex={0} role="button"
            aria-label={`${r.semester}: GPA ${r.gpa !== null ? two(r.gpa) : 'none'}, CGPA ${two(r.cgpa!)}`}
            onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} style={{ outline: 'none' }} />
        ))}
      </svg>
      {a && active !== null && (
        <div role="status" className="tip" style={{ left: Math.min(Math.max(x(active) - 80, 0), width - 160) }}>
          <b>{a.semester}</b>
          <span>GPA <em>{a.gpa !== null ? two(a.gpa) : 'none'}</em></span>
          <span>CGPA <em>{two(a.cgpa!)}</em></span>
          {a.change ? <span>Change <em className={a.change > 0 ? 'up' : 'down'}>{signed(a.change)}</em></span> : null}
        </div>
      )}
      <div className="legend">
        <span><i className="key-line" />CGPA after each semester</span>
        <span><i className="key-bar" />That semester's GPA</span>
        <span><i className="key-dash" />Under 2.00 is probation</span>
      </div>
    </div>
  );
}
