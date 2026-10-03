# Admission cutoff, document review, and ISO branding

## What will change
- Replace the footer certification image with the supplied ISO 21001:2018 mark after removing its white background.
- Derive both `favicon.png` and `favicon.ico` from that same transparent mark.
- Add one college-wide Grade 12 cutoff, initially **150**, which an admin can increase or decrease from the dashboard.
- Classify each submitted application from its verified Grade 12 score:
  - **150 or higher:** pending document review and allowed to continue.
  - **Below 150:** placed on the waiting list and not allowed to continue unless an admin approves them.
- Keep every submission subject to manual document review. Admins can approve, reject, move to waiting list, or undo a previous approval by returning it to pending review.
- Show students a clear application status and prevent progression when they are waiting-listed, pending review, or rejected.

## Technical details
- Add a protected admission-settings table with a single cutoff value and admin-only update access.
- Apply the cutoff in the database when applications are inserted so students cannot bypass it from the browser.
- Extend the application status controls and student-facing status labels without changing existing uploaded documents.
- Update the dashboard with a numeric cutoff control and reversible application actions.
- Preserve the existing manual Grade 12 document/entered-score match check; the cutoff is applied to that verified score.
- Verify the database rule, admin controls, footer image, favicons, and student status screens in the preview.
