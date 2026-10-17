# Department exams and registration upgrades

## What will change
- **Exams inside the portal:** Department heads can create, edit, preview, publish and close their own exams using a Google Forms–style editor. Include multiple-choice, short-answer and paragraph questions, required answers, question points, an opening/closing schedule and a time limit. Keep existing Google Forms exams available; new exams do not require Google Forms.
- **Answers and grades:** Each head sees only their department’s students and exam submissions, reviews answers, assigns points and feedback, and publishes grades. Students see their submitted exam status and published grade. Existing placement decisions remain separate and unchanged.
- **Exam protection:** Require an explicit start, request fullscreen, save answers during the attempt, randomize question/option order, enforce the timer on the server, and prevent duplicate submissions. Warn before navigation and report tab switches, fullscreen exits and detected departure to the department head. Browsers cannot completely prevent leaving, screenshots or screen recording; no false guarantees.
- **Filtered Excel downloads:** Add department, program and application-status filters alongside registration dates and student search. Preview the matching count and export exactly the matching student records, excluding staff.
- **Ethiopian birth dates:** Replace the shared application’s Gregorian birth-date control with an Ethiopian calendar picker, including all 13 months and correct Pagumen/leap-year handling. Preserve existing stored dates, age calculations and photo autofill by converting selections to the existing date format; show Ethiopian dates with an E.C. label.
- **Additional admins:** Add an Admins tab where existing admins can create new admin accounts. Newly created admins retain ordinary admin functions but cannot create admins or grant themselves that power. Existing admin accounts retain creation authority; it is not automatically given to future admins.

## Technical approach
- Add protected exam, question, attempt, answer and grading records with explicit grants and department-scoped access. Keep grading data and any answer keys out of student-readable question records.
- Use authenticated server operations for starting/submitting attempts and publishing grades, validating eligibility, department membership, schedules, points and attempt state. Store the attempt’s question order and deadline so refreshes cannot reset them.
- Enforce admin-creation authority in protected database records and the authenticated account-management function, including protection against direct role-table privilege escalation. Never derive authority from editable profile information or browser storage.
- Reuse the shared application form, existing design controls, student identification, exit-alert view and account-management service. Use a maintained Ethiopian calendar conversion library.

## Verification
- Test department isolation, unpublished exam visibility, attempt deadlines and duplicate submission, grading bounds and grade visibility, and created-admin denial of further admin creation.
- Test Ethiopian New Year/Pagumen conversions, preservation of existing birth dates, and inclusive Excel date/department/program/status filtering.
- Exercise a published native exam from a real student account through submission and head grading, and verify the grade reads back on the student dashboard. Report any unavailable account or camera-dependent checks explicitly.