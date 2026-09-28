import { useStore } from '../store';

// the whole CGPA, step by step, so anyone can redo it on a phone calculator
export default function ByHand() {
  const { totals: s } = useStore();
  const points = s.cgpa !== null ? s.sums.points / 1000 : null;
  const credits = s.cgpa !== null ? s.sums.credits / 100 : null;
  const fmt = (v: number) => String(Math.round(v * 100) / 100);

  return (
    <section className="card by-hand" aria-labelledby="by-hand">
      <h2 id="by-hand">Check it yourself with a calculator</h2>
      <p className="muted">Any phone calculator will do. This is exactly what BRACU CGPA Analyzer and Connect do.</p>

      <h3>Your CGPA</h3>
      <ol className="how">
        <li>
          <b>List the courses that count.</b> Leave out P, W and I, courses numbered 001 to 099, and any attempt
          your sheet marks NT (it was replaced by a later one). An F stays in: it adds credits but no points.
        </li>
        <li>
          <b>Points for each course:</b> grade point × credits. An A- in a 3 credit course is 3.7 × 3 = 11.1.
        </li>
        <li><b>Add up all the points,</b> then <b>add up all the credits</b> of the same courses.</li>
        <li>
          <b>Divide</b> points by credits. Keep three decimals, then round: 5 or more in the third decimal goes up.
          So 156.3 ÷ 51 = 3.0647, which is 3.065, which shows as 3.07.
        </li>
      </ol>
      {points !== null && credits !== null && (
        <p className="yours">
          Yours: <span className="mono">{fmt(points)} ÷ {fmt(credits)} = {(points / credits).toFixed(4)}</span>, shown as <b className="mono">{s.cgpa!.toFixed(2)}</b>
        </p>
      )}

      <h3>After a Repeat or Retake</h3>
      <ol className="how">
        <li><b>Take the old grade out:</b> subtract its points (old grade point × credits) from your total points.</li>
        <li><b>Put the new grade in:</b> add new grade point × credits.</li>
        <li><b>Credits stay the same,</b> because the course still counts once. Divide again.</li>
      </ol>
      <p className="example">
        Example: 303.6 points over 97 credits. Repeat a 3 credit C (2.0) and get an A (4.0):
        303.6 − 6 + 12 = 309.6, and 309.6 ÷ 97 = 3.1918, so 3.19. For an F retake, the old points are 0,
        so you only add.
      </p>

      <h3>After a new semester</h3>
      <ol className="how">
        <li><b>Add the new courses' points</b> to your total points (or the semester GPA × its credits).</li>
        <li><b>Add their credits</b> to your total credits, then divide.</li>
      </ol>
      <p className="example">
        Example: 303.6 points over 97 credits, then 12 credits at a 3.50 GPA: 303.6 + 42 = 345.6 points,
        97 + 12 = 109 credits, and 345.6 ÷ 109 = 3.1706, so 3.17.
      </p>
      <p className="muted small">
        Starting from the CGPA on Connect instead of your points? Multiply it by your credits first (3.13 × 97 = 303.61).
        That CGPA is already rounded, so the answer can be 0.01 off.
      </p>
    </section>
  );
}
