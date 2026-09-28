import { useState } from 'react';
import { GRADE_POINTS, LETTER_GRADES, LetterGrade } from '../engine/grades';
import { two } from '../format';

// for anyone without a grade sheet: works from the CGPA and credits on Connect.
// A CGPA is already rounded, so this is an estimate and says so
export default function QuickEstimate({ intro = 'No grade sheet at hand? Type the CGPA and credits from Connect.' }: { intro?: string }) {
  const [cgpa, setCgpa] = useState(3.2);
  const [credits, setCredits] = useState(60);
  const [gpa, setGpa] = useState(3.5);
  const [termCredits, setTermCredits] = useState(12);
  const [old, setOld] = useState<LetterGrade>('C');
  const [fresh, setFresh] = useState<LetterGrade>('A');
  const [oldCredits, setOldCredits] = useState(3);
  const ok = credits > 0 && cgpa >= 0 && cgpa <= 4;
  const shown = (v: number) => two(Math.min(4, Math.max(0, Math.round(v * 100) / 100)));
  return (
    <section className="card" aria-labelledby="qk">
      <h2 id="qk">Quick estimate</h2>
      <p className="muted">{intro}</p>
      <div className="inputs">
        <label>Your CGPA now<input className="field mono" type="number" min={0} max={4} step={0.01} value={cgpa} onChange={(e) => setCgpa(Number(e.target.value))} /></label>
        <label>Credits counted in it<input className="field mono" type="number" min={1} max={220} value={credits} onChange={(e) => setCredits(Number(e.target.value))} /><small>Credits earned, plus any F not retaken yet.</small></label>
      </div>
      <div className="two">
        <div className="sub-card">
          <h3>After one more semester</h3>
          <div className="inputs">
            <label>GPA<input className="field mono" type="number" min={0} max={4} step={0.01} value={gpa} onChange={(e) => setGpa(Number(e.target.value))} /></label>
            <label>Credits<input className="field mono" type="number" min={1} max={24} value={termCredits} onChange={(e) => setTermCredits(Number(e.target.value))} /></label>
          </div>
          <p>Your CGPA becomes about <b className="mono big">{ok ? shown((cgpa * credits + gpa * termCredits) / (credits + termCredits)) : 'n/a'}</b></p>
        </div>
        <div className="sub-card">
          <h3>After one Repeat or Retake</h3>
          <div className="inputs three">
            <label>Old grade<select className="field mono" value={old} onChange={(e) => setOld(e.target.value as LetterGrade)}>{LETTER_GRADES.map((g) => <option key={g}>{g}</option>)}</select></label>
            <label>New grade<select className="field mono" value={fresh} onChange={(e) => setFresh(e.target.value as LetterGrade)}>{LETTER_GRADES.map((g) => <option key={g}>{g}</option>)}</select></label>
            <label>Credits<input className="field mono" type="number" min={1} max={6} value={oldCredits} onChange={(e) => setOldCredits(Number(e.target.value))} /></label>
          </div>
          <p>Your CGPA becomes about <b className="mono big">{ok ? shown((cgpa * credits - GRADE_POINTS[old] * oldCredits + GRADE_POINTS[fresh] * oldCredits) / credits) : 'n/a'}</b></p>
        </div>
      </div>
      <p className="muted small">An estimate: the CGPA you type is already rounded, so this can be off by 0.01. Upload your grade sheet for the exact figure.</p>
    </section>
  );
}
