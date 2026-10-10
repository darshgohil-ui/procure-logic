# Procure Logic Codebase Audit

## Audit scope

This audit treats the preserved ZIP/codebase as the latest working source. Per the supplied instructions, no source files were modified, no project was rebuilt, and no deployment was attempted. The audit covers the existing frontend, backend, database schema, document pipeline, source-of-truth behavior, action handlers, analyst path, persistence, testing, and deployment requirements.

## Executive summary

The codebase contains a coherent Procure Logic decision-room application with an existing React frontend, Express/tRPC backend, Drizzle/MySQL database layer, object storage integration, document extraction pipeline, evidence records, requirement evaluations, risk records, scoring/recommendation logic, notifications, audit events, and human decision persistence.

The most important limitation is that the deployed demo experience depends on seeded procurement data in `server/db.ts`. The seed data is persisted to the database when a database is available, but it is not user-uploaded source material. The frontend has largely been changed to read the workspace snapshot, but several visible strings, prompts, local-only settings, and actions remain demo/prototype behavior. The production workflow cannot be fully tested or used until a valid production `DATABASE_URL` is configured and the Drizzle schema is applied.

The analyst route does query the current room snapshot and attempts an LLM response with evidence IDs, but when the LLM is unavailable it falls back to deterministic heuristic answers. Those answers are grounded against snapshot values/evidence IDs, but they are not a complete evidence reasoning engine and do not fully implement conflict-aware provenance.

## Status legend

| Status | Meaning |
|---|---|
| ✅ COMPLETE / WORKING | Implemented in the inspected code and connected to persisted data or a real action path. |
| ⚠️ PARTIAL / NEEDS WORK | Present, but incomplete, prototype-oriented, weakly validated, or not fully persisted. |
| ❌ MISSING / BROKEN | Not implemented, unreachable, or fails without required infrastructure. |
| 🔴 CRITICAL | Blocks trustworthy production use, persistence, or deployment. |

## 1. Frontend audit

| Area | Status | Findings |
|---|---|---|
| Pages/routes | ✅ | `App.tsx` routes the application into the existing `Home` workspace. The main views are implemented as sections in `Home.tsx`: overview, compare, requirements, risks, and documents. |
| Components | ✅ | The page contains reusable drawers, overlays, panels, navigation items, evidence drawer, analyst drawer, search overlay, notifications panel, help panel, settings panel, profile menu, and upload modal. |
| Navigation | ✅ | Sidebar and tab navigation switch views. Room selection is connected to `workspace.rooms` and the bootstrap query. Some secondary actions remain toast-only. |
| Decision Room | ✅ | The active room is loaded from the workspace bootstrap and can be selected from persisted rooms. The default room is created/located through `ensureSeedData`. |
| Vendor comparison | ✅ | Comparison data is mapped from `snapshot.vendors`, `snapshot.requirements`, and `snapshot.evaluations`. Vendor values are not solely read from frontend constants in the current mapping. |
| Requirements | ⚠️ | Requirement rows and weights are loaded from the snapshot and weight mutations call `workspace.updateRequirement`. Classification/display logic and interpretation strings still contain index-based assumptions in parts of `Home.tsx`. |
| Risks & gaps | ⚠️ | Risk cards are mapped from persisted risks. Risk overview and some labels historically contained fixed demo values; the current source still requires cleanup of every remaining fixed display claim. Risk-card actions are not connected to a clarification mutation. |
| Documents | ⚠️ | Document rows are mapped from persisted documents, but the document view contains legacy fixed coverage/version copy and some actions only show toast messages rather than opening a stored document or evidence source. |
| Evidence | ⚠️ | Evidence cards/drawers display persisted evidence fields including original text, page, classification, confidence, and interpretation. The “Open evidence in document” action is still a toast rather than a real document/page viewer. |
| Ask the Decision | ⚠️ | The inline chat and full analyst drawer call `workspace.analystQuery` with the current room ID. The full drawer currently only applies the returned answer text and does not fully map backend source IDs into the displayed source references. |
| Decision Brief | ⚠️ | The brief is presented as the overview view. Several explanatory paragraphs and notes remain seeded/demo copy rather than being generated from the current decision model. |
| Audit Trail | ⚠️ | The backend exposes `workspace.auditTrail`, and mutations create audit events in several paths. The current sidebar Audit trail action only shows a toast; there is no audit-trail view rendering the persisted event list. |
| Settings | ❌ | Settings state is local React state. The panel explicitly describes itself as a prototype and does not persist profile, room preference, alert preference, or compact-row preference. |
| Notifications | ⚠️ | Notifications are queried from the backend and read status is mutated/persisted. The panel action routing is real, but notification preferences are not persisted and some notification destinations are generic. |
| Sync | ✅/⚠️ | The Sync action calls `workspace.sync`, which recalculates the decision model and returns current metrics. It refreshes the workspace query. It does not independently reprocess unchanged documents or reconcile external sources. |
| Login/profile | ⚠️ | Auth procedures and session cookie logout exist, but the visible login modal is a local validation/toast prototype. The profile menu mostly opens local panels or shows toasts; it is not a complete account/profile management flow. |
| Buttons/interactions | ⚠️ | Core view navigation, upload submission, room switching, weights, sync, accept decision, search, notifications, and analyst submission have real paths. Several buttons are placeholders: profile details, decision brief, audit trail, document viewer, version history, change summary, risk clarification, evidence external open, and some settings actions. |

### Frontend issues requiring eventual changes

| Issue | File/component | Why it matters | Eventually change |
|---|---|---|---|
| Fixed procurement copy remains in overview/brief/document sections | `client/src/pages/Home.tsx` | It can display claims that do not belong to the active room or current database state. | Generate all summary copy from decision-model explanations, current evidence, risks, and documents; use `UNKNOWN` when absent. |
| Document viewer and evidence-open actions are toast-only | `Home.tsx` `EvidenceDrawer`, `Documents` | Users cannot follow an evidence claim back to the stored source document/page. | Add a secure signed-URL/document viewer route with page/row anchors and preserve source locations. |
| Audit trail navigation is toast-only | `Home.tsx` sidebar | Persisted audit events cannot be reviewed by users, defeating auditability. | Add an audit-trail view backed by `workspace.auditTrail`. |
| Settings are local-only | `Home.tsx` `SettingsPanel` | Preferences disappear on refresh/login and are not account/workspace state. | Add a persisted user/workspace preferences table and procedures. |
| Login modal is not real authentication | `Home.tsx` `LoginModal` | It accepts any syntactically valid email/password and only displays a success toast. | Use the existing OAuth/session flow or a real credential provider; do not claim login success locally. |

## 2. Backend audit

| Area | Status | Findings |
|---|---|---|
| API/server | ✅ | Express server and tRPC router are present. The app has a typed `appRouter` with workspace procedures. |
| Authentication | ⚠️ | Session user context and logout exist. For unauthenticated demo operation, `actorId` creates/uses a demo actor based on environment/default values. This is convenient for demo mode but is not production authentication. |
| Database access | 🔴 | `getDb()` depends on `process.env.DATABASE_URL`; without it, most real routes fail with “Database is not configured” or cannot resolve the demo actor. |
| CRUD operations | ✅/⚠️ | Room creation, vendor add/update/delete, requirement add/update/delete, upload, notifications read, and decision acceptance exist. Several mutation paths need more complete validation and user-facing UI actions. |
| Procurement logic | ⚠️ | `processDocumentFacts` and `recalculateDecisionModel` implement a deterministic pipeline, but the quality depends on the extraction heuristics and seeded data model. |
| AI/analyst logic | ⚠️ | `analystQuery` supplies the current snapshot to `invokeLLM` with a JSON schema and validates evidence IDs. If LLM invocation/parsing fails, it uses `deterministicAnswer`, which is heuristic rather than a full model-backed answer. |
| Document processing | ✅/⚠️ | Upload stores the file, creates version records, extracts supported formats, records processing status/coverage, and persists failure states. Asynchronous/background processing is not used; processing occurs inside the mutation request. |
| Evidence generation | ⚠️ | Raw extraction units and identified procurement facts become evidence. However, upload code inserts raw unit evidence as `FACT` even when the unit is merely raw text, and duplicate/overlapping evidence controls are limited. |
| Requirement matching | ⚠️ | `processDocumentFacts` maps procurement facts to requirements using normalized concepts/keywords. Matching is deterministic and useful, but it needs stronger provenance and explicit handling when multiple sources map to one requirement. |
| Risk detection | ⚠️ | Risks are created for missing mandatory facts, hard constraints, unknowns, and related conditions. Risk severity/action logic is deterministic but not a comprehensive risk taxonomy. |
| Contradiction detection | ❌/⚠️ | The schema supports `CONFLICT`, but the inspected upload/matching flow does not show a complete generalized contradiction detector comparing multiple evidence sources for the same concept. |
| Scoring | ✅/⚠️ | Scores are recalculated from evaluations/weights. Score explanations and qualification details exist in the model output, but seed scores and seed evaluations can make the initial room look authoritative before real documents are uploaded. |
| Recommendation | ✅/⚠️ | `recalculateDecisionModel` computes rankings and recommendation state and marks unresolved mandatory requirements as blocking. Initial seed decision data is still present and can be mistaken for live proposal-derived analysis. |
| What-if logic | ⚠️ | Requirement weight updates recalculate persisted model state. The frontend scenario display still presents a local normalized slider scenario and a toast-only “Save scenario” action; a separate persisted scenario/profile model is not implemented. |
| Human overrides | ⚠️ | `acceptDecision` persists a selected vendor/rationale and audit data. A broader override system for manually overriding evaluations, risk status, evidence classification, or requirement interpretation is not exposed. |
| Audit events | ✅/⚠️ | Audit events are inserted for document extraction/failure, analyst queries, decision acceptance, vendor mutations, notification reads, and requirement changes in inspected paths. There is no complete UI viewer and coverage should be checked for every mutation. |
| Notifications/sync | ✅/⚠️ | Notifications are persisted and read status is updated. Sync recalculates the model. Notifications are not yet a full event-driven processing system and sync does not provide a durable run record. |

### Backend issues requiring eventual changes

| Issue | File/component | Why it matters | Eventually change |
|---|---|---|---|
| Demo actor fallback is used for public procedures | `server/routers.ts` `actorId`, `getRoomId` | Unauthenticated users can operate through a synthetic owner context when database/config permits. | Require authenticated production sessions; isolate explicit demo mode behind a development flag. |
| Seed/demo data is used as the initial workspace | `server/db.ts` `seedVendors`, `seedRequirements`, `ensureSeedData` | Seed rows can be confused with real vendor submissions and evidence. | Mark seed records explicitly as demo, show a demo banner, or require an empty workspace for production. |
| Contradiction detection is incomplete | `server/db.ts`, `server/routers.ts`, `documentExtraction.ts` | Conflicting proposals may be shown as facts instead of `CONFLICT`. | Group evidence by normalized concept/vendor, compare source values, create conflict evidence/risk records, and audit the resolution. |
| Upload processing is synchronous | `server/routers.ts` uploadProposal | Large documents can exceed request limits/timeouts and users cannot observe intermediate processing. | Move extraction to a durable job/queue or persisted processing worker while retaining status updates. |
| Evidence source URLs/page opening are not implemented | `server/routers.ts`, `storage.ts`, `Home.tsx` | Traceability stops at text/page metadata and does not open the actual stored source. | Add signed URL retrieval and format-aware viewer/opening behavior. |

## 3. Database audit

| Area | Status | Findings |
|---|---|---|
| Database technology | ✅ | Drizzle ORM with `drizzle-orm/mysql2`; intended database is MySQL/TiDB-compatible. |
| Schema | ✅ | `drizzle/schema.ts` defines users, decision rooms, vendors, requirements, evaluations, documents, versions, evidence, commercial items, risks, decisions, audit events, notifications, and evaluation profiles. |
| Tables | ✅ | The schema is broad enough to support the requested workflow. |
| Relationships | ✅/⚠️ | Foreign keys exist in the migration. Most room ownership checks are implemented in queries. More cascading/deletion policy and historical integrity should be reviewed before production. |
| Migrations | ✅/⚠️ | `drizzle/0000_pale_captain_america.sql` exists. The project must apply it to the production database; the audit did not find a configured production migration runner in the available environment. |
| Seed/demo data | ⚠️ | `ensureSeedData` creates the ERP modernization room and seeded vendors/requirements/documents/evidence. This is useful for demo mode but is not real proposal ingestion. |
| Persistence | ✅/🔴 | Persistence exists when `DATABASE_URL` is valid. In the current sandbox, `DATABASE_URL` is absent, so database workflows fail. |
| Required environment variables | ⚠️ | `DATABASE_URL` is required for database access. Storage credentials and OAuth/runtime environment values are also needed for complete production behavior. |
| DATABASE_URL requirements | 🔴 | Must be configured as a server-side WebDev environment secret/variable and migrations must be applied. Without it, integration tests and live database functionality cannot run. |

## 4. Document pipeline audit

| Stage | Status | Findings |
|---|---|---|
| Upload document | ✅ | `workspace.uploadProposal` accepts base64 input, enforces a 50 MB limit, stores the object, resolves/creates a vendor, and creates/updates a document record. |
| Processing status | ✅ | Status changes from `UPLOADING` to `PROCESSING`, then `PROCESSED`/review/failure states. Failure versions and notifications are persisted. |
| Text extraction | ✅ | `extractProposal` supports the existing format-specific extractors and records extracted text/data. Unsupported formats fail honestly. |
| Page/source preservation | ⚠️ | Page/coverage fields are preserved for page-based extraction. CSV/XLSX locations are represented as structured locations, but raw unit evidence page assignment is not universally meaningful. |
| Structured extraction | ⚠️ | `identifyProcurementFacts` and `identifyUnknownConcepts` are deterministic helpers. They do not perform general semantic extraction for every procurement concept. |
| Evidence | ⚠️ | Facts and raw extraction units are stored with source text and document/version IDs. Raw extraction units are inserted as FACT regardless of semantic certainty, which can overstate evidence quality. |
| Requirement mapping | ⚠️ | Requirement matches are persisted through `processDocumentFacts`; mapping relies on deterministic concept/name matching. |
| Vendor comparison | ✅/⚠️ | Evaluations and vendor snapshots can be recalculated from stored evidence. Seed records can dominate the initial result. |
| Risks | ⚠️ | Missing/unknown/hard-constraint risks are created. General conflict detection and comprehensive risk coverage remain incomplete. |
| Scoring | ✅/⚠️ | Model recalculation returns ranking/coverage/resolved counts and updates vendor scores. It needs production data and stronger provenance for trustworthy results. |

## 5. Source-of-truth check

### Confirmed backend-derived paths

The workspace bootstrap calls `recalculateDecisionModel` and then `getRoomSnapshot`. Vendors, requirements, evaluations, risks, documents, evidence, room metrics, notifications, and audit data are available from the persisted snapshot. Room selection, search, notification reads, requirement weight mutation, sync, analyst query, upload, and decision acceptance have backend routes.

### Remaining frontend demo/static paths

The following classes of frontend content remain static or prototype-oriented in `Home.tsx`: suggested analyst questions containing named demo vendors; seeded overview narrative and decision notes; fixed “Decision brief updated” date; fixed lowest-TCO explanatory copy; local settings; local login/profile behavior; static help text; generic toast-only navigation; and document/version copy that does not always read from the current evidence ledger. These do not necessarily override the backend snapshot, but they can display claims that are not true for another room or a new uploaded proposal.

`server/db.ts` also contains seeded vendors, seeded requirements, seeded documents, seeded evidence, and a seeded selected decision. These are persisted demo records, not frontend-only constants, so the key issue is provenance/labeling rather than a frontend query bypass.

## 6. Functionality check

| Action | Status | Reason |
|---|---|---|
| Login/profile | ⚠️ | Session logout exists; visible login/profile interactions are mostly local prototype behavior. |
| Help/question mark | ✅ | Opens contextual help panel and closes correctly; help content is static. |
| Notification bell | ✅/⚠️ | Opens persisted notifications and can mark read; actions are generic and preference settings are local. |
| Ask the Decision | ⚠️ | Calls current-room analyst procedure; fallback and source rendering need stronger evidence handling. |
| Question submission/answer | ✅/⚠️ | Text submission works through tRPC; answer parsing/source linking is partial in the full drawer. |
| Sync | ✅ | Calls backend recalculation and refreshes the query. |
| Settings | ❌ | No persistence; explicitly local prototype state. |
| Procure Logic logo/cross | ✅ | Sidebar collapse/mobile close works. |
| Active Decision Room selector | ✅ | Uses room query and bootstrap reload. |
| Q3/ERP modernization | ⚠️ | Seed/default room is available; it is demo data unless populated from real uploads. |
| Add proposal | ✅/⚠️ | Upload modal posts base64 and invokes extraction; needs configured database/storage to work. |
| Evidence links | ⚠️ | Evidence drawer opens; external document/page opening is toast-only. |
| Open document | ⚠️ | Document row action does not open a stored document viewer. |
| Risk details | ⚠️ | Risk card opens a toast; clarification action has no mutation. |
| Requirement editing | ✅/⚠️ | Weight mutation persists; editing name/classification UI is not fully exposed. |
| Weight changes | ✅ | Calls `updateRequirement` and invalidates/refetches the workspace in the modified code. |
| What-if controls | ⚠️ | Slider is interactive; scenario save is toast-only and not persisted as a scenario. |
| Human override | ⚠️ | Accept recommendation persists a decision; broader override controls are absent. |
| Audit trail | ⚠️ | Events exist, but the navigation does not render the audit list. |
| Decision Brief | ⚠️ | Overview acts as brief; generated/current-state content is incomplete. |
| Navigation | ✅/⚠️ | Main navigation works; several secondary actions are placeholders. |

## 7. AI analyst audit

The analyst does not merely return one fixed predefined answer. `workspace.analystQuery` loads the current room snapshot, serializes vendors/requirements/evaluations/evidence/risks/documents/decision/weights/ranking, asks the LLM for strict JSON containing an answer and evidence IDs, filters source IDs to evidence present in the current snapshot, and returns the answer. This is the complete path when the LLM is available.

However, the fallback is deterministic and heuristic. It recognizes question keywords such as cost/TCO, risk/clarification, version, and general ranking, then constructs answers from current vendors/evidence. It is not a full retrieval-and-reasoning implementation, and the UI does not fully expose all returned evidence IDs in the full analyst drawer. The system prompt correctly instructs `UNKNOWN`, `CONFLICT`, and `DERIVED`, but the persistence layer does not yet guarantee that every generated answer has direct source-level validation beyond ID filtering.

## 8. Data persistence audit

| Persistence scenario | Status | Findings |
|---|---|---|
| Page refresh | ✅/🔴 | Should reload persisted state through bootstrap when `DATABASE_URL` works; currently blocked in the sandbox without it. |
| Navigation | ✅ | Workspace context remains available while Home view state changes. |
| Logout/login | ⚠️ | The visible login flow is not real authentication; persistence behavior across actual accounts is not verified. |
| Reopening decision room | ✅/🔴 | Room data is queried by room ID and ownership; requires a functioning database and real auth. |
| Settings/preferences | ❌ | Local React state only. |
| Human decision | ✅/⚠️ | `acceptDecision` persists selected vendor/rationale and audit event; UI only exposes acceptance, not a complete override history/editor. |

## 9. Testing audit

The repository has tests for document extraction and procurement workspace behavior. The extraction tests pass in the available environment. The procurement integration tests cover seed/bootstrap, upload/versioning, notification read scoping, requirement edits, decision acceptance, and unsupported upload failure paths, but they require a configured database and currently fail with “Database is not configured” / “Unable to resolve demo actor” when `DATABASE_URL` is absent.

Missing or weakly covered areas include browser-level end-to-end tests for upload-to-recommendation, evidence opening, room switching, analyst source links, settings persistence, audit-trail rendering, real authentication, production storage access, conflict detection, and human override persistence beyond acceptance.

## 10. Deployment audit

| Requirement | Status | Detail |
|---|---|---|
| Build command | ✅ | `pnpm build` runs Vite and bundles the server with esbuild. |
| Runtime | ✅ | Node.js/Express/tRPC server. The production server serves `dist/public`. |
| Database | 🔴 | A production MySQL/TiDB-compatible database is required. Configure `DATABASE_URL` server-side. |
| Migrations | ⚠️ | Apply the Drizzle SQL migration before using the application. |
| Storage | 🔴/⚠️ | `storagePut` requires configured storage endpoint/credentials. Uploads cannot be production-functional without storage configuration. |
| Authentication | ⚠️ | OAuth/session environment values are required for real account authentication; demo actor fallback should not be used as production auth. |
| Analytics | ⚠️ | Build reports missing `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID`; these are warnings unless analytics is required. |
| Permanent deployment | ⚠️ | The site URL is live, but the underlying editable WebDev project is not exposed in the current task session, so this codebase cannot be published to that site from here. |

## Critical blockers

1. **🔴 `DATABASE_URL` is not configured in the available environment.** This prevents database-backed tests, seeded actor resolution, workspace mutations, and real persistence.

2. **🔴 Production storage configuration is required for document upload.** The upload route uses `storagePut`; without valid object storage configuration, the end-to-end document flow cannot operate.

3. **🔴 The underlying WebDev project for `procureai-mopenr9n.manus.space` is not attached to this session.** The modified codebase can be preserved and handed off, but publishing to the same permanent URL requires opening/attaching the existing project from the Manus project/deployment interface.

4. **🔴 Demo seed data is not clearly isolated from production data.** Until labeled or separated, seeded vendors/evidence/recommendations can be mistaken for real proposal-derived results.

## Files audited

The primary audited implementation files were `client/src/pages/Home.tsx`, `client/src/App.tsx`, `client/src/components/DashboardLayout.tsx`, `server/routers.ts`, `server/db.ts`, `server/documentExtraction.ts`, `server/documentVersioning.ts`, `server/storage.ts`, `drizzle/schema.ts`, the Drizzle migration under `drizzle/`, and the server test files.

## Final determination

The project is a substantial working prototype with real persistence-oriented architecture and a meaningful procurement processing path. It is not yet a fully trustworthy production procurement system. The strongest next implementation priorities are: configure and migrate the production database/storage, isolate or remove demo seed data, complete conflict/contradiction detection, make document/evidence opening real, render the audit trail, persist settings and broader human overrides, and replace remaining static decision-brief claims with model/evidence-derived content.
