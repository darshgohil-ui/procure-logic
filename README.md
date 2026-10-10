# Procure Logic — Procurement Decision Intelligence

Procure Logic is a full-stack procurement decision workspace for comparing vendor proposals against weighted requirements. The current Paper Trail UI is preserved while the project now uses tRPC + Express + Drizzle + MySQL/TiDB, Manus OAuth, managed S3-compatible storage, persistent decision-room entities, evidence-aware analyst queries, constraints-aware scoring, audit events, notifications, backend search, and proposal extraction.

## Run locally

Use Node.js 22 or newer and pnpm 10 or newer.

```bash
cd /home/ubuntu/procurement-decision-intelligence
pnpm install
pnpm run check
pnpm test
pnpm run dev
```

For a production-style local run:

```bash
cd /home/ubuntu/procurement-decision-intelligence
pnpm run build
pnpm run start
```

The development server uses the managed runtime and must not rely on a hard-coded port. Run `pnpm run format` to format source files.

After changing `drizzle/schema.ts`, generate a migration with `pnpm drizzle-kit generate`, review the SQL for destructive statements, apply it through the managed database workflow, and rerun `pnpm run check`, `pnpm test`, and `pnpm run build`.

## Environment and configuration

Do not commit `.env` files or copy managed secrets into source control. The full-stack template expects these injected variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL/TiDB connection string for Drizzle. |
| `JWT_SECRET` | Session cookie signing. |
| `VITE_APP_ID` | Manus OAuth application identifier. |
| `OAUTH_SERVER_URL` | OAuth backend base URL. |
| `VITE_OAUTH_PORTAL_URL` | Frontend login portal URL. |
| `OWNER_OPEN_ID` / `OWNER_NAME` | Owner identity used by auth and per-user demo seeding. |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | Server-side LLM, storage, notification, and platform API access. |
| `VITE_FRONTEND_FORGE_API_URL` / `VITE_FRONTEND_FORGE_API_KEY` | Frontend-safe Forge integration values. |
| `VITE_ANALYTICS_ENDPOINT` / `VITE_ANALYTICS_WEBSITE_ID` | Optional managed analytics. |

Managed deployment supplies these values. Local work that exercises database, OAuth, LLM, or storage calls requires equivalent environment configuration.

## Architecture and project structure

```text
procurement-decision-intelligence/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx                 # Theme, providers, and routes
│       ├── index.css               # Preserved Paper Trail visual system
│       ├── main.tsx                # React Query + tRPC bootstrap
│       ├── const.ts                # OAuth login helper
│       ├── pages/Home.tsx           # Decision-room UI and interaction state
│       ├── pages/NotFound.tsx
│       ├── components/              # UI primitives and reusable scaffold pieces
│       │   └── AIChatBox.tsx        # Reusable chat component
│       └── lib/trpc.ts              # Typed tRPC client
├── drizzle/
│   ├── schema.ts                   # Persistent procurement domain schema
│   ├── relations.ts
│   └── migrations/                  # Generated migration metadata and SQL
├── server/
│   ├── db.ts                       # Database helpers, seed, snapshots, scoring, audit
│   ├── routers.ts                  # Typed tRPC procedures and ownership guards
│   ├── documentExtraction.ts       # PDF, DOCX, XLSX, and CSV extraction
│   ├── storage.ts                  # Managed S3-compatible storage helpers
│   ├── procurement.test.ts          # Workspace, scoring, ranking, mutation tests
│   ├── documentExtraction.test.ts   # CSV/XLSX extraction and validation tests
│   ├── auth.logout.test.ts
│   └── _core/                      # Managed Express, OAuth, tRPC, LLM, storage, runtime
├── shared/                          # Shared constants and types
├── package.json                     # Scripts and dependencies
├── pnpm-lock.yaml                   # Locked dependency graph
├── ideas.md                         # Paper Trail design direction
├── todo.md                          # Work history and continuation checklist
└── README.md
```

## Backend behavior

The `workspace` router exposes owned room bootstrap/listing, room creation, vendor and requirement mutations, document listing and proposal upload, evidence and risk reads, comparison and decision-model reads, audit trail, user-scoped notifications, backend search, analyst queries, sync/recalculation, and decision acceptance. Entity mutations validate that the current actor owns the related room.

`ensureSeedData()` creates an idempotent Q3 ERP modernization room per owner. The seeded data is server-side bootstrap context, not frontend application truth. The Home page maps the backend snapshot into the existing display model and only uses its local arrays as a database-unavailable fallback.

`recalculateDecisionModel()` separates known weighted evidence from unknown weight, does not award numeric credit for unknowns, identifies mandatory failures, mandatory unknowns, preferred unknowns, and hard-constraint violations, computes eligible-first ranking order, returns requirement-level contributions, updates room aggregates, and records an audit event. A recommendation is qualified only when mandatory and hard-constraint evidence is resolved; otherwise it is explicitly conditional.

Proposal uploads are stored with `storagePut()`. Uploads are versioned by document and vendor, then extracted server-side. PDF output is page-oriented; DOCX output is paragraph-oriented; XLSX output is sheet/row-oriented; CSV output is record-oriented. Extracted units are stored as version text/data and evidence rows with document-version provenance. Processing reports `UPLOADING`, `PROCESSING`, `PROCESSED`, `REVIEW_REQUIRED`, or `FAILED`; no successful state is claimed when parsing fails or review is required.

The analyst calls the server-side LLM with structured JSON output, a constrained evidence context, and source IDs. Returned IDs are filtered against the current room’s evidence ledger. If the LLM is unavailable or malformed, the deterministic fallback remains evidence-safe and explicitly reports absent support.

## Current product behavior

The active route is `/`. The preserved UI includes the decision overview, vendor comparison, weighted requirements, risk register, document intelligence, backend search overlay, login/profile interactions, notifications, help, settings, sync, evidence drawer, proposal upload, decision acceptance, and inline/full-screen analyst chat. Refreshes re-read persistent room state; relevant mutations trigger recalculation, audit entries, notifications, and frontend refetches.

## Known limitations

PDF/DOCX/XLSX/CSV text or table extraction is implemented, but OCR for scanned PDFs, semantic chunking, embeddings, vector retrieval, and automatic requirement-to-evidence classification are not yet implemented. Extraction currently runs synchronously during the upload request; a background worker is recommended for large files.

The LLM uses a structured room snapshot and extracted evidence rows rather than a vector index. It is instructed to avoid unsupported claims, but production teams should still review citations before award. Exact document-viewer deep links, page highlighting, clarification-question persistence, export files, and full decision-note collaboration are not yet complete.

The UI retains a deterministic local fallback if the database is unavailable so the visual workspace remains renderable. That fallback is not persisted application truth. OAuth requires valid injected variables and callback configuration; anonymous demo access resolves a per-owner seeded room.

## Continuation guidance

Preserve the existing Paper Trail visual system and extend the typed tRPC contract rather than replacing `Home.tsx`. The next high-value increment is asynchronous processing with OCR and retrieval indexing: parse uploaded files, create normalized evidence chunks, link them to requirements, index them, and reuse the current `analystQuery` response contract. Keep scoring assumptions, unknown states, ownership checks, audit records, and source provenance explicit. Add a Vitest case for every new mutation before changing the UI.
