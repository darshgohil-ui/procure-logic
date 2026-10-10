# Procure Logic update checklist

- [x] Inspect current login/search entry points and existing workspace interaction states.
- [x] Add a functional login view with validation, demo access, and clear error states.
- [x] Add a functional global search overlay with keyboard shortcut and result navigation.
- [x] Replace the generic analyst drawer entry point with an evidence-aware AI chat workspace.
- [x] Preserve vendor comparison, requirements, risks, documents, evidence drawer, upload, and decision actions.
- [x] Add proposal-grounded chat responses, source chips, suggested questions, and follow-up composer behavior.
- [x] Verify desktop and mobile layouts, build, and major interaction surfaces.
- [x] Save a new checkpoint and deliver the updated version.

## Final preservation and handoff

- [x] Verify the current working tree, package files, and configuration documentation.
- [x] Run the final type-check and production build.
- [x] Document local commands, project structure, environment requirements, and known bugs.
- [x] Save the final continuation checkpoint for another coding agent.

## Dead-control repair pass

- [x] Make the decision-room selector open, list rooms, and update the active room context.
- [x] Make the logo/cross, bottom-left profile, top-right profile, notification bell, help button, Settings, Sync, Review queue, and navigation controls functional.
- [x] Replace any queued analyst response with an immediate answer derived from the current procurement data.
- [x] Make evidence, risk, requirement, vendor comparison, search, and proposal interactions visibly update or open useful detail.
- [x] Verify all controls with a fresh load, route/view changes, refresh, and responsive checks.
- [x] Save the repaired project checkpoint.

## Full-stack implementation pass

- [x] Upgrade the static project to the supported full-stack web-db-user foundation.
- [x] Define persistent procurement domain tables and relationships.
- [x] Seed the Q3 ERP modernization decision room and preserve current demo data.
- [x] Add backend procedures for rooms, vendors, requirements, documents, evidence, risks, notifications, decisions, sync, auth, and analyst queries.
- [x] Add deterministic decision-model recalculation and evidence-grounded analyst query handling.
- [x] Connect the existing frontend to backend data and mutation states without redesigning the UI.
- [x] Add real upload/storage and document processing states where supported by the project foundation.
- [x] Test refresh, navigation, authentication, editing, upload, analysis, sync, and error paths.
- [x] Save the full-stack continuation checkpoint.

## Full-stack completion gaps

- [x] Implement backend recalculation for vendor scores, rankings, evidence coverage, and room aggregates during sync and requirement edits.
- [x] Persist requirement weight changes from the Requirements UI through the backend mutation.
- [x] Correct document processing status rendering and add a post-upload processing transition.
- [x] Add explicit tests for recalculation, upload lifecycle, sync, requirement edits, and failure paths.
- [x] Re-run full checks and save the final full-stack checkpoint.

## Final production-correctness pass

- [x] Add actual PDF, DOCX, XLSX, and CSV extraction with page/sheet provenance.
- [x] Use honest UPLOADING, PROCESSING, PROCESSED, REVIEW_REQUIRED, and FAILED document states.
- [x] Preserve extracted content and structured values in document versions and evidence provenance.
- [x] Refactor scoring to separate known score, unknown weight, mandatory failures, mandatory unknowns, preferred unknowns, and hard-constraint violations.
- [x] Return conditional recommendations with explainable requirement contributions and real relevant evidence sources.
- [x] Remove frontend hardcoded arrays as live application truth and make search backend-backed.
- [x] Enforce room ownership and valid foreign-key access on workspace procedures.
- [x] Persist meaningful notifications, decision acceptance rationale, versioning, audit events, and post-mutation refreshes.
- [x] Make sync reload persisted state, verify statuses, recalculate, and return ranking/coverage/unresolved results without artificial delay.
- [x] Add tests for extraction, statuses, constraints, unknown weights, ownership, search, notifications, versioning, and failure paths.
- [x] Run the full build/test and real user-flow checks, document unavoidable limitations, and save the final checkpoint.

## Correctness follow-up gaps

- [x] Add explicit tests for ownership/forbidden access, backend search, notification read behavior, document version increments, and extraction failure paths.
- [x] Remove or minimize live hardcoded analyst fallback content when a backend snapshot is available.
- [x] Run browser smoke tests against the newest extraction, search, ownership, notification, and analyst flows.
- [x] Save a new final checkpoint after the newest changes and validations.
