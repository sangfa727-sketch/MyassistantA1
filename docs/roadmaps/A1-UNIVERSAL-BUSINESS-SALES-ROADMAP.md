# Assistant A1 — Universal AI Business Brain & Multi-Business Orchestration Roadmap

**Snapshot:** 2026-11-17  
**Repository:** `sangfa727-sketch/MyassistantA1`  
**Backend:** Neon project `tiny-dream-67171265` (`MyassistantA1 backend`)  
**Release posture:** NOT PRODUCTION READY — roadmap only; no production schema or data changes authorized by this document.

## 1. Product outcome

Build one Assistant A1 that can serve personal users and multiple independent business accounts. Within a business account it can act as an authorized seller/admin over thousands of products, customers, stock locations, prices, orders and operational workflows.

A1 must always derive its active identity, workspace, role and permissions from a verified server-side session. It must never trust a client-supplied account/workspace ID, product owner, role, or permission claim.

## 1A. Universal AI Business Brain north star

A1 is the **reasoning, context and orchestration layer**, not a replacement for every business system. It understands intent, assembles only authorized context, decomposes work, routes to a narrowly scoped agent, selects typed tools, tracks durable execution state, verifies results and explains what happened.

The target architecture has nine layers:

1. **Central Brain & Orchestration:** intent classification, context assembly, bounded planning, agent routing, tool selection, execution state, result verification, retries/recovery and clear explanations.
2. **Multi-Business / Multi-Workspace:** personal scope plus multiple organizations/workspaces, industry profiles, membership, roles, action-level permissions and tenant-specific goals/knowledge. Every query, prompt, memory, file, cache, job, log and tool call must remain tenant-scoped.
3. **Persistent Context & Knowledge:** governed user preferences, business profiles, policies, products/services, customers, decisions and outcomes with provenance, timestamps, correction, staleness, retention and deletion controls. Personal memory must never be joined to business memory.
4. **Specialized Agent Network:** strategy/business advisor, sales, marketing/research, customer support, finance analysis, HR, operations, inventory/procurement, real estate/property and personal productivity. Agents receive only narrow tools and authorized context; handoffs are bounded and auditable.
5. **Universal Tool & Integration Engine:** typed, schema-validated connectors for ERP2, CRM, databases, files, email, messaging, calendars and automation. Credentials are server-side, least-privilege and scoped; every connector has timeouts, retries, idempotency, rate limits and health telemetry.
6. **Controlled Action Engine:** reasoning proposes; deterministic policy authorizes; a separate executor acts. Actor, workspace, tenant, role, resource and limits are revalidated server-side. Payments, transfers, irreversible deletion, order cancellation, campaign publishing/sending and property commitments require explicit in-product confirmation and an audit record.
7. **Business Intelligence & Decision Support:** evidence-grounded KPIs, forecasts, anomaly/risk detection, scenario comparisons and measurable recommendations. State assumptions and uncertainty; do not fabricate live facts or certainty.
8. **Learning & Evaluation:** evaluation datasets, task-success and tool-use metrics, hallucination/security regression tests, feedback, model routing, cost/latency telemetry and versioned prompts. No uncontrolled self-modification or safety-policy weakening.
9. **Production Scale:** concurrency controls, durable background workflows, tenant-aware caches, backup/restore drills, observability, alerts, incident response, privacy/retention and controlled rollout.

### ERP2 boundary

ERP2 remains the authoritative sales/POS/inventory/accounting execution system when its APIs and security are verified. A1 should interpret requests, analyze authorized ERP2 data, recommend, prepare drafts and invoke approved APIs. Do not duplicate ERP2 transaction engines. An ERP2 integration is not complete until API contracts, credential scope, tenant mapping, permission checks, idempotency, audit trail, failure recovery and end-to-end tests all pass. This A1 roadmap does not authorize changes to ERP2.

### Delivery order

Identity and workspace membership → tenant isolation and server/database authorization → durable conversation/memory/knowledge → typed tool registry and policy engine → central orchestrator plus one complete specialized-agent workflow → additional agents/connectors → approvals/durable execution/audit/recovery → intelligence/evaluation/scaling/release.

### Non-negotiable invariants

1. **Tenant isolation:** Account A cannot read, search, infer, modify, export or transact on Account B data — including through AI context, tools, caches, imports, reports, background jobs, logs or error messages.
2. **Personal/business separation:** Personal memory and personal records are separate from every business workspace. Switching workspace is explicit and server-validated.
3. **Fail closed:** Missing identity, membership, permission, ownership or tenant scope means deny; never fall back to global data.
4. **Server-side authority:** Every read and write is scoped and authorized in server code and enforced again at the database boundary where supported.
5. **Transaction integrity:** Stock reservation/decrement, order creation, payment state and audit event are atomic or use a durable idempotent workflow. Prevent overselling and duplicate orders.
6. **AI is not an administrator by prompt:** Model output proposes actions; a deterministic policy/permission engine authorizes them. High-impact actions require configured confirmation.
7. **Evidence before release:** CI Green alone is insufficient. Require negative cross-tenant tests, end-to-end workflow tests, production smoke tests and rollback evidence.

## 2. Verified baseline (2026-11-17)

### Repository and application

- Repository: `sangfa727-sketch/MyassistantA1`, default branch `main`, currently **public**. A prior project readiness record says private visibility is required; resolve this through an account owner/admin action and verify before confidential production data is used.
- Current application is a mobile-first Next.js AI chat UI with a server-side `/api/chat` route and OpenAI-compatible model provider.
- Existing model tools are limited to calculator and current-time lookup. There is no verified product, inventory, CRM, order, POS or payment tool execution.
- Current rate limiter is an in-memory Map (20 requests/minute/client key); it is not safe as a multi-instance global quota.
- README explicitly says GitHub Pages hosts static UI only; server APIs require a separate Next.js-compatible backend.

### Open pull requests

- **PR #44** — signed HttpOnly session-cookie proof. Open and unmerged. The 2026-11-18 hardening changed it to one stable cookie name (avoids unbounded cookie accumulation) while the HMAC remains bound to the session UUID. Latest recorded head after this change: `6893d9419cef6e1b944f3948cad2bef75a41c686`; fresh CI/security checks are pending. It is still not account authentication, workspace membership or tenant authorization.
- **PR #45** — this Universal AI Business Brain roadmap. Open and documentation-only; latest checks must be re-run after the 2026-11-18 update.
- **PR #35 and PR #16** — older robot-rendering/occlusion fixes, open and unrelated to the business-brain backend. Leave them isolated; each still needs its own visual runtime acceptance before merge.

### Neon database

- Project: `tiny-dream-67171265`, region `aws-us-east-2`.
- `production` branch: `br-damp-frost-b4cx7a7n`, ready/default.
- `a1-auth-staging` branch: `br-odd-star-b4loue7u`, ready.
- `a1-neon-persistence`: archived.
- Read-only production catalog inspection found only `public.a1_sessions` and `public.a1_messages`.
- No business catalog, workspace membership, inventory, customer, order, payment or business audit schema was found.
- Prior readiness evidence records Managed Better Auth provisioned on staging but not integrated into the app; production auth and production ownership/RLS are not established. Revalidate staging auth configuration before implementation.

## 3. Roadmap phases and release gates

| Phase | Scope | Acceptance gate |
|---|---|---|
| 0. Baseline & release controls | Reconcile open PRs, confirm repository privacy, hosting, secrets, backup/restore, staging environment and CI protection | Signed-off inventory; no production mutation; CI/security baseline recorded |
| 1. Identity & authentication | Integrate the staged Managed Better Auth using the current official Next.js SDK (`@neon/auth`); sign-up, OTP email verification, sign-in/out, recovery, session rotation/revocation and server-side identity | Auth E2E passes; unauthenticated requests denied; no client-trusted identity |
| 2. Personal + workspace model | Personal scope, business workspaces, users, memberships, roles, invitations, active-workspace resolution | User can belong to multiple workspaces; switching is explicit; personal data never joins business scope |
| 3. Tenant security foundation | Tenant ownership columns, composite foreign keys, scoped repository/query layer, database role strategy, RLS policies and FORCE RLS where appropriate; audit trail | A/B adversarial tests deny cross-tenant SELECT/INSERT/UPDATE/DELETE and side-channel leakage |
| 4. Product catalog | Products, variants, SKU, barcode, categories, units, attributes, images/imports, price lists; indexed search and pagination | Import/search/update 10k+ synthetic products with tenant isolation and bounded latency |
| 5. Inventory & purchasing | Warehouses/locations, stock ledger, reservations, adjustments, suppliers, purchase receiving, reorder rules | Atomic stock movements, idempotency, no negative stock except explicitly configured policy |
| 6. Customers & CRM | Tenant-scoped contacts, consent, interaction history, segments, support cases and communication preferences | Cross-tenant CRM isolation; consent and retention controls verified |
| 7. Orders, POS & payments | Quotes, carts, orders, line-item price snapshots, discounts/tax rules, payment intents/status, refunds, receipts | Concurrent checkout test prevents oversell/double charge; payment provider webhooks verified and idempotent |
| 8. AI Sales/Admin agent | Read-only discovery first; tool registry with typed schemas, tenant context injected server-side, RBAC/ABAC, policy checks, confirmation tiers, idempotency and audit | AI cannot bypass policy by prompt injection, forged tool arguments or workspace switching |
| 9. Reporting & accounting | Sales/stock/AR/AP summaries, cash movements, exports, reconciliation and immutable audit history | Totals reconcile to source transactions; exports remain tenant-scoped |
| 10. Production hardening | Shared rate limits, per-account quotas/spend caps, observability, alerts, backup restore drills, retention/export/deletion, incident/rollback runbooks | Load, abuse, recovery, privacy and security acceptance signed off |
| 11. Controlled release | Private pilot accounts, staged rollout, monitoring, support process and rollback | No critical/high security issue; production E2E and tenant-isolation evidence retained |

## 4. AI Admin/Sales permission model

Use roles as starting points, not as the sole authority:

- **Owner:** workspace settings, users, role grants, integrations and financial controls.
- **Admin:** manage catalog, stock, customers and operational settings within granted scope.
- **Sales:** quote, create orders and view only permitted customer/order data.
- **Inventory:** receive, count, transfer and adjust stock within limits.
- **Accountant:** view/reconcile financial records and perform explicitly granted accounting actions.
- **Viewer:** read-only access.

Enforce action-level permissions such as `catalog.product.read`, `catalog.product.update`, `inventory.adjust`, `order.create`, `order.cancel`, `payment.refund`, `workspace.member.invite`. Add limits by amount, location, product class and approval threshold.

Suggested confirmation tiers:
- Read/search and draft quote: no extra confirmation after authorization.
- Create order or reserve stock: policy-configured confirmation and idempotency key.
- Stock adjustment, cancellation, refund, price override, export or member/role change: explicit confirmation; stricter roles/limits.
- High-risk financial or destructive actions: owner approval or dual control.

The LLM must never choose the tenant. The server derives tenant context from the authenticated session and membership, then injects it into every tool call. Tool arguments must not be able to override it.

## 5. Product catalog and scale strategy

- Keep canonical product records tenant-owned; support tenant-specific SKU/barcode and optional shared reference taxonomy without sharing private price/stock/customer data.
- Separate product identity, variant, unit, price list, warehouse stock and stock ledger.
- Use PostgreSQL indexes for tenant + SKU/barcode, category and common filters; use full-text/trigram search where measured to help. Consider vector search only for semantic discovery, never as an authorization boundary.
- Use cursor pagination, bounded filters, import staging, validation reports and asynchronous bulk jobs.
- Every search index, cache key and background job must include tenant scope and authorization context.
- Benchmark 10k, 100k and 1m catalog rows with realistic tenant distribution before selecting further search infrastructure.

## 6. Mandatory security and quality test matrix

For at least two seeded tenants A and B, test:
- direct IDOR by substituting session, workspace, product, customer, warehouse, order and payment IDs;
- list, detail, search, autocomplete, aggregate, export, import and bulk endpoints;
- create/update/delete and foreign-key association attacks;
- AI prompt injection requesting another tenant's data or asking the model to change account context;
- forged tool arguments containing another `tenant_id` or owner ID;
- cache-key collisions, stale sessions, revoked membership and role changes;
- background jobs, retries, webhook replay, logs and error responses;
- simultaneous purchases/reservations and duplicate client retries;
- backup restore and data export/deletion behavior.

Required result: **zero cross-tenant reads or writes**. A single leak is a release blocker.

## 7. Delivery sequence and change control

- Work one bounded PR at a time; do not mix robot UI changes with authentication, schema or sales logic.
- Build and test schema changes on `a1-auth-staging` first. Never apply an unreviewed migration to production.
- Prefer additive/backward-compatible migrations, explicit rollback notes and a verified backup/restore path.
- Re-run tests against the exact PR head SHA; inspect changed files and migration SQL; require CI + security checks Green.
- Production migration/deployment requires a separate explicit release gate and verified rollback.
- Do not mark a phase complete based on code presence alone; attach test evidence and runtime verification.

## 8. Immediate next actions

1. Reconcile PR #44 and verify its exact-head CI/security status; keep its scope limited to session-cookie protection.
2. Resolve repository privacy and branch-protection through authorized GitHub account settings; the current integration previously could not read branch-protection settings.
3. Inspect the staged Managed Better Auth configuration and integrate it into the app without enabling production auth prematurely.
4. Create the identity/workspace data model and threat model on staging; review schema and RLS behavior using a non-owner application role.
5. Add A/B tenant isolation tests before building catalog or sales features.
6. Only after Phase 3 passes, implement catalog → inventory → CRM → orders/payments → AI agent in that order.

**Current phase status:** Phase 0 baseline partially completed; Phase 1 staging provider provisioned but app integration pending; Phases 2–11 not implemented or not evidenced. No production-ready claim is permitted yet.
