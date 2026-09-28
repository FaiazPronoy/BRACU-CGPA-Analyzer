# Hisab (হিসাব)

**The BRACU CGPA calculator that counts exactly the way your grade sheet does.**

Upload the grade sheet from Connect and Hisab works out every semester again,
checks each one against what the sheet prints, and then answers the questions
students actually ask:

- Which courses should I repeat or retake to lift my CGPA the most?
- What will my CGPA be at graduation if I get straight A grades from here? Or
  A- in everything? Or 4.00 in half of what is left?
- How many times have I made the VC's List and the Dean's List?
- Am I on track for Distinction?

Everything runs in the browser. There is no account and no server, and the
grade sheet never leaves the device.

## What is in it

**1. Grades.** Upload the Connect grade sheet (PDF), try a sample transcript,
or type semesters in by hand. After an upload, every semester's GPA, CGPA and
credit totals are recomputed and compared with the sheet's own summary lines,
and the page says so if anything disagrees. The program (CSE, BBA, and so on)
is read from the sheet as well.

**2. Overview.** A graph of the CGPA across semesters, with each semester's GPA
behind it, the probation and distinction lines, and the biggest jump and drop
marked. Beside it, a dashboard:
- the program and how many credits are left
- VC's List and Dean's List counts, and which semesters
- the CGPA at graduation if the remaining credits are all 4.00, half 4.00,
  all 3.70, your average so far, or any grade you pick

Below: best and toughest semester, academic standing, year level and
distinction band.

**3. Boost.** Choose how many courses to take again, the grade you expect and
the semester you are planning for. Hisab finds the best set under three rules:
by the book (F retakes, and repeats still inside their 2 semester window), with
the Head of Department's permission (older courses too), and F retakes only.
It shows the CGPA after the best 1, 2, 3 and more, and a list to pick your own,
each course marked with whether it is allowed and why.

**4. Plan.** Try next semester's courses, work out the average GPA needed to
reach a target CGPA, or get a quick estimate from just a CGPA and credits.

**5. BRACU rules.** The grading scale and the policies behind every number, in
plain words.

English and Bangla, light and dark, and it works on a phone.

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

Needs Node 20 or later. On Windows, double-click `RUN-Hisab.bat`: it installs
the packages the first time, starts the site and opens it in your browser.

By hand:

```bash
npm install
npm run dev        # http://localhost:5180
npm test           # the unit tests (and your own sheets in fixtures/private)
npm run build      # the static site, in dist/
```

`tools/browser_checks.py` (Playwright) opens every page in English and Bangla,
light and dark, and checks for console errors, WCAG AA contrast and sideways
scrolling at 390 px. Start `npm run dev` first.

## Putting it online

It is a static site with no backend, and the build uses relative paths and hash
routes, so `dist/` works from anywhere:

- **Netlify or Cloudflare Pages:** build command `npm run build`, publish
  directory `dist`.
- **GitHub Pages:** push `dist/` to a `gh-pages` branch, or use the Pages
  action with the same build.

## Made with

React 18, TypeScript and Vite. pdf.js reads the grade sheet. The chart is
hand-drawn SVG, with no chart library. Fonts: Sora, Manrope, DM Mono, Caveat and
Noto Sans Bengali.

## Not official

Hisab is an independent student tool, not a BRAC University service. It is as
accurate as the published rules and the tests above make it, but for anything
that really matters (graduation, probation, a retake plan) confirm with your
advisor.
