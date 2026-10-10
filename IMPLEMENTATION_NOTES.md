# Final Integration Pass

This archive contains the requested procurement integration pass.

## Applied changes

The application now keeps the uploaded project’s existing visual design while removing the main live frontend data fallbacks. Workspace rooms, vendors, requirements, documents, evidence, risks, search results, notifications, and recommendation metrics are sourced from the workspace backend when available. Room switching uses persisted decision rooms, requirement weight changes invalidate and reload the active workspace, and notification reads are persisted through the backend.

The document upload flow preserves the existing PDF, DOCX, XLSX, XLS, and CSV extractors and now adds deterministic procurement fact identification, explicit unknown handling, requirement matching, evidence records that retain the original source wording and location, evaluation updates, hard-constraint and mandatory-unknown risks, audit events, notifications, and decision-model recalculation. The implementation does not claim AI analysis for deterministic extraction.

The decision model now treats unresolved mandatory requirements as ineligible for an unconditional recommendation and exposes qualification, blocking issues, hard-constraint violations, mandatory unknowns, decision drivers, trade-offs, and an alternative vendor in the decision-model response.

Authorization checks remain tied to decision-room ownership for room-scoped reads and writes, and the missing authentication hook required by the existing dashboard component has been restored.

## Verification

`pnpm check` passes.

`pnpm build` passes. Vite reports the project’s pre-existing analytics placeholder warnings and the existing runtime storage asset warning.

The extraction-focused test suite passes. The database-backed procurement integration tests require a configured `DATABASE_URL`; in the supplied sandbox they cannot initialize the demo actor/database because no database connection is configured.
