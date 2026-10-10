# Final correctness smoke-test notes

The latest development preview renders the preserved Paper Trail workspace at desktop width. The backend-backed search overlay opens from the top search control, accepts the query `migration`, and shows its loading state while the tRPC search request runs. The active room context and evidence-first decision overview remain visible. TypeScript, production build, and the expanded Vitest suite pass before this smoke test. Remaining validation is a mobile capture and final checkpoint after the latest code changes.

The newest browser session opens the full analyst drawer from the main Ask the decision control. The drawer exposes suggested questions, an evidence-aware composer, and the latest backend-backed answer path. Desktop and narrow mobile captures both remain usable with the existing composition preserved. The expanded test suite now passes 13 tests across auth, extraction, scoring, ownership, search, notifications, and failure lifecycle behavior.

The latest browser smoke test confirms the analyst drawer opens from the primary Ask the decision control and the notification panel opens from the bell. The notifications surface lists persisted activity items including evidence review, risk detection, and decision-model updates. The current preview remains visually intact.
