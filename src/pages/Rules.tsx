import ByHand from '../components/ByHand';
import { GRADE_POINTS, LETTER_GRADES, MARKS } from '../engine/grades';

const REMARK: Partial<Record<string, string>> = { 'A+': 'Exceptional', A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor', F: 'Failure' };

// each rule as a question a student would actually ask
const RULES: [string, string[]][] = [
  ['How is my CGPA worked out?', [
    'CGPA = sum of (grade points × credits) ÷ the credits that count. For each course only the attempt that counts is used; courses numbered 001 to 099 are remedial or non-credit and do not count.',
    'Rounding: Connect takes the CGPA to three decimals, then a 5 or more in the third decimal rounds up. So 3.895 shows as 3.90 and 3.894 as 3.89, and 156.3 ÷ 51 = 3.0647 becomes 3.065 and then 3.07. Checked against every figure on real grade sheets.',
  ]],
  ['What happens when I retake an F?', [
    'A course with an F may be retaken twice; a third try only by exception from the Chairperson or the Dean (for example on probation). Non-credit courses (091, 092) in the first or second semester get one retake.',
    'The best grade counts. The earlier attempts stay on the sheet as NT and still count as credits attempted.',
  ]],
  ['Can I repeat a course I passed?', [
    "Once per course, to improve the grade, within 2 semesters of first taking it. Later than that needs your Chairperson's permission.",
    'The latest grade counts, even if it comes out lower. The old attempt stays on the sheet as NT.',
  ]],
  ['What about P, I and W?', [
    'None of them carries grade points, so none changes your GPA. A P still earns its credits, and a W or I never replaces an earlier grade.',
    'Incomplete turns into an F if you miss the make-up exam. Pass/Fail needs the instructor to agree: at most 4 credits a semester and 16 in total.',
  ]],
  ["How do I get on the VC's List or the Dean's List?", [
    "A semester GPA of 3.90 to 4.00 puts you on the VC's List; 3.70 to 3.89 on the Dean's List.",
    'You need at least 12 letter-graded credits that semester (9 in the Residential Semester), no F, W or I, and no retake or repeat in it.',
  ]],
  ['When am I on probation?', [
    'Joined in Summer 2022 or later: a CGPA under 2.00 puts you on probation, with 3 semesters in a row to get back to 2.00 (2 for Pharmacy and LLB). After that you are considered for withdrawal, though the Dean or Chairperson can recommend more time.',
    'Joined before Summer 2022: the line was 1.50, with 2 semesters to recover, and a CGPA of 2.00 needed by the end of the sixth semester.',
  ]],
  ['What do I need to graduate, and with honours?', [
    'The credits your program asks for (at least 120; CSE is 136), at least 70 of them at BRAC University, a CGPA of at least 2.00, and the Residential Semester.',
    "Distinction: 3.50 to 3.64. High Distinction: 3.65 to 3.79. Highest Distinction: 3.80 or more. The Chancellor's and Vice Chancellor's Gold Medals go to the top CGPAs, with at least 3.65.",
  ]],
  ['What is my year level and course load?', [
    'By credits earned: Freshman up to 30, Sophomore 31 to 60, Junior 61 to 90, Senior 91 to 140, Advanced Senior above 140.',
    'A semester is usually 9 to 15 credits (18 with approval); the first semester is 9 credits or three courses.',
  ]],
];

export default function Rules() {
  return (
    <div className="stack">
      <div className="page-head">
        <h1>How BRACU grades</h1>
        <p className="lead">The grading scale and every rule behind your numbers, in plain words. Straight from the university's policy pages.</p>
      </div>
      <div className="rules-grid">
        <section className="card" aria-labelledby="scale">
          <h2 id="scale">The grading scale</h2>
          <div className="table-wrap">
            <table className="plain">
              <thead><tr><th scope="col">Grade</th><th scope="col">Marks</th><th scope="col" className="num">Points</th><th scope="col">Meaning</th></tr></thead>
              <tbody>
                {LETTER_GRADES.map((g) => {
                  const [lo, hi] = MARKS[g];
                  return (
                    <tr key={g}>
                      <th scope="row" className="mono">{g}</th>
                      <td>{g === 'A+' ? `${lo} to 100` : g === 'F' ? `under ${hi}` : `${lo} to under ${hi}`}</td>
                      <td className="num">{GRADE_POINTS[g].toFixed(1)}</td>
                      <td className="muted">{REMARK[g] ?? ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted small">A+ has been given since Fall 2020 and is worth 4.0, the same as an A.</p>
        </section>
        <div className="stack tight">
          {RULES.map(([q, a], i) => (
            <details key={q} className="card fold" open={i === 0}>
              <summary><b>{q}</b></summary>
              <div className="fold-body">{a.map((p) => <p key={p}>{p}</p>)}</div>
            </details>
          ))}
        </div>
      </div>
      <ByHand />
      <p className="muted small">
        Source: BRAC University,{' '}
        <a href="https://www.bracu.ac.bd/academics/policies-and-procedures" target="_blank" rel="noreferrer">Policies and Procedures</a> and{' '}
        <a href="https://www.bracu.ac.bd/academics/policies-and-procedures/academic-standings-and-honors" target="_blank" rel="noreferrer">Academic Standings and Honors</a>, read September 2026.
      </p>
    </div>
  );
}
