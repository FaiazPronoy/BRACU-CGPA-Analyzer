# BRACU CGPA Analyzer

**The BRACU CGPA calculator that counts exactly the way your grade sheet does.**

Upload the grade sheet from Connect and the Analyzer works out every semester again,
checks each one against what the sheet prints, and then answers the questions
students actually ask:

- Which courses should I repeat or retake to lift my CGPA the most?
- What will my CGPA be at graduation if I get straight A grades from here? Or
  A- in everything? Or 4.00 in half of what is left and 3.70 in the rest?
- How many times have I made the VC's List and the Dean's List?
- Am I on track for Distinction?

Everything runs in the browser. There is no account and no server, and the
grade sheet never leaves the device.

## What is in it

Four pages, each named after the job it does:

**1. My CGPA.** Upload the Connect grade sheet (PDF), try a sample student, or
type semesters in by hand. Rather not upload anything? The quick estimate on the
first page works from just the CGPA and credits shown on Connect. After an upload, every semester's GPA, CGPA and
credit totals are recomputed and compared with the sheet's own summary lines,
and a dialog says whether they all match. The program (CSE, BBA, and so on) is
read from the sheet as well. Then the dashboard:
- the CGPA, standing and year level, credits done out of the program total,
  and VC's List and Dean's List counts
- a graph of the CGPA across semesters, each semester's GPA behind it, the
  probation line, and the biggest jump and drop marked (or the same as a table)
- best and toughest semester, and how many of each grade
- the CGPA at graduation if the remaining credits are all 4.00, half 4.00 and
  half 3.70, all 3.70, your average so far, or any grade you pick

**2. Repeat or Retake.** One sentence to fill in: "I will Repeat/Retake 3
courses and expect an A in Summer 2026". The Analyzer picks the courses that lift the
CGPA most, either from the last 2 semesters plus any F, which you can take at
advising, or older than 2 semesters too, which need the Chairperson's
permission. Each pick says whether it is allowed and until when, and a course
that needs permission says how many semesters ago it was first taken. You can also
tick courses yourself.

**3. Plan ahead.** Try next semester's courses, see what a target CGPA needs
(with mixes like "10 courses at A and 7 at A-", and which repeats would make an
impossible target possible), or get a quick estimate from just a CGPA and
credits.

**4. My courses.** Every semester, folded away until you open it. Edit, add or
remove a course or a semester, upload a new grade sheet, or **Start over**,
which clears everything after asking once. Start over is also in the top bar.

**BRACU rules.** The grading scale and the policies behind every number, as
questions a student would ask, and how to check your CGPA with a calculator:
what to add, what to take out after a repeat or retake, and what to divide by.
With a grade sheet loaded it shows your own sum.

Light and dark, and it works on a phone.

## How the numbers are worked out

All of this follows BRAC University's published rules
([Policies and Procedures](https://www.bracu.ac.bd/academics/policies-and-procedures),
[Academic Standings and Honors](https://www.bracu.ac.bd/academics/policies-and-procedures/academic-standings-and-honors),
read September 2026), and was then checked against real grade sheets.

- **Which attempt counts.** A repeat (to improve a grade) counts the latest
  grade, even if it is lower. A retake (after an F) counts the best grade.
  Since a retake only follows an F, that is always the latest attempt as well.
  The replaced attempts are the NT rows on the sheet: out of the CGPA, but still
  in credits attempted. A W or I never replaces an earlier grade.
- **P, I and W** carry no grade points. A P still earns its credits.
- **Semester GPA** includes every course taken that term, even one repeated later.
- **Rounding.** Connect takes the CGPA to three decimals first, then rounds
  half up to two. So 156.3 ÷ 51 = 3.0647 becomes 3.065 and then 3.07, which is
  what the sheet prints; rounding straight to two places would give 3.06. The
  sums are done in whole numbers (grade points × 10, credits × 100), because
  floating point stores 3.895 as 3.8949... and would round it the wrong way.
- **F rows print 0.00 credits** (that column is credits earned). Their credits
  come from another attempt of the same course, or from the semester's
  "Credits Attempted" total.
- **VC's List** for a semester GPA of 3.90 to 4.00, **Dean's List** for 3.70 to
  3.89 (from BRACU's own
  [ceremony notice](https://www.bracu.ac.bd/news/vcs-and-deans-list-certificate-awarding-ceremony)).
  Both need at least 12 letter-graded credits, no F, W or I, and no retake or
  repeat that semester.
- **Repeat window.** A passed course can be repeated once, within 2 semesters of
  first taking it. Later than that needs permission. F retakes have no window
  (two are allowed, a third only by exception).
- **Probation.** Students who joined in Summer 2022 or later: under 2.00, with 3
  semesters to recover (2 for Pharmacy and LLB). Before that: 1.50.
- **Program credits**, from each program's page and the admission brochure:
  CSE, EEE, ECE, Microbiology and Biotechnology 136; CS 124; BBA 130; APE 130;
  Anthropology 130; Physics 132; AELS 132; Mathematics 127; Economics and
  English 120; LLB 135; Disaster Management 141; Pharmacy 164; Architecture 207.
  Curricula change with the intake, so the total can always be edited.

### How it was checked

- Unit tests (`npm test`) cover every rule above, including a brute-force
  check that the "best n courses" plan is never beaten by any other combination.
- Four real grade sheets (CSE and BBA, with F, I, P, NT, RP and RT rows): every
  semester's GPA, CGPA, credits attempted and credits earned, 288 figures in
  all, come out exactly as printed. For one of them the VC's and Dean's List
  results were also checked against the student's official transcript (1 Dean's
  List and 7 VC's List, all 12 semesters the same).
- The graduation projections were recomputed independently with exact fractions.

Those sheets belong to real students, so they are not in the repository.
Put any Connect grade sheet in `fixtures/private/` (git ignores that folder)
and `npm test` checks it too.

## Running it

Needs Node 20 or later. On Windows, double-click `RUN-BRACU-CGPA-Analyzer.bat`: it installs
the packages the first time, starts the site and opens it in your browser.

By hand:

```bash
npm install
npm run dev        # http://localhost:5180
npm test           # the unit tests (and your own sheets in fixtures/private)
npm run build      # the static site, in dist/
```

`tools/browser_checks.py` (Playwright) opens every page, light and dark, empty
and with a transcript, and checks for console errors, WCAG AA contrast and
sideways scrolling at 390 px. It also runs Start over, imports any sheets in
`fixtures/private/`, and saves screenshots to `tools/shots/`. Start
`npm run dev` first.

## Putting it online

It is a static site with no backend, and the build uses relative paths and hash
routes, so `dist/` works from anywhere:

- **Netlify or Cloudflare Pages:** build command `npm run build`, publish
  directory `dist`.
- **GitHub Pages:** push `dist/` to a `gh-pages` branch, or use the Pages
  action with the same build.

## Made with

React 18, TypeScript and Vite. pdf.js reads the grade sheet. The chart is
hand-drawn SVG, with no chart library. Fonts: Sora, Manrope, DM Mono and Caveat.

## Not official

BRACU CGPA Analyzer is an independent student tool, not a BRAC University service. It is as
accurate as the published rules and the tests above make it, but for anything
that really matters (graduation, probation, a retake plan) confirm with your
advisor.
