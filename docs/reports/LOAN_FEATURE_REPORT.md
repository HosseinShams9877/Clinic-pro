# LOAN FEATURE REPORT

**Delivered:** 2026-11-18 · **Status:** implemented and verified in-repo; the
sandbox itself is unreachable from this build machine (§6)
· **Commits:** none (all changes left uncommitted for owner review — `git diff`)

**Scope.** A complete, secure credit/loan request flow built on the Simorq
Tejarat JetPay credit-consumption API, wired into the existing Phase 1/2 site
as an explicit extension of scope by the owner's instruction. It amends
**one decision only**: the *loan half* of Q3 (`OPEN_QUESTIONS.md`, amended
2026-11-18). Every other binding constraint stays in force — the club half of
Q3 is untouched, Q4's no-dead-links/no-stubs rules still apply, the visual
fidelity standard (CLAUDE.md §2 rule 7) is honoured by porting the reference's
own `loan.html`/`loan.css`/`#loan` design rather than inventing one.

**Source of truth for the bank integration:** the official PDF
(`__مستند_سرویس_مصرف_اعتباری_سیموتک_v1_2_0_2_.pdf`, v1.2.0), read in full and
transcribed into code. Wherever the task description and the PDF differed, the
PDF won (e.g. "verify OTP" is the documented `purchase` endpoint; "transaction
status" is `/inquiry`, a nested step list).

---

## 1. The flow implemented (per the PDF)

```
browser                our routes (src/app/api/loan/*)          JetPay sandbox
  |                       |                                        |
  |  national code        |  POST /token  {username, password,      |
  |  -------------------> |  terminalId}  --------------------->    |
  |                       |  <------- { result: { token } } -------|  §1-4
  |                       |  (JWT cached until 60 s before exp)    |
  |  POST /inquiry        |  GET /account-balance?nationalCode=     |
  |  -------------------> |  ----------------::Bearer------->      |  §1-5
  |  <---- requestId,    |  <--- credits + customer_detail --------|
  |        credits[]      |                                        |
  |  POST /send-otp       |  POST /send-otp {nationalCode,         |
  |  (amount + credit)    |  requestId, creditId, amount} -------->|  §1-6
  |  <---- masked mobile  |  <--- { result: { mobile } } ----------|
  |  POST /verify (otp)   |  POST /purchase {…, otp} -------------->|  §1-8
  |  <---- transactionId, |  <--- { transactionId, referenceNumber,|
  |        referenceNumber|        status: PENDING } --------------|
  |  GET /status (poll)   |  GET /inquiry?referenceNumber= ------->|  §1-13
  |  <---- steps: PURCHASE|  <--- [[{step, status, amount, …}]] ---|
  |        COMPLETED      |                                        |
  |  POST /confirm        |  POST /confirm {referenceNumber} ----->|  §1-9
  |  <---- CONFIRMED      |  <--- { status, creditInfo } ----------|
```

The PDF's §1-7 (installment calculator), §1-10…§1-12 (refund and its OTP/
confirm) are **not** implemented: the public request flow cannot reach them,
and a refund UI is out of the stated scope.

---

## 2. Database schema (Prisma 6, SQLite dev / PostgreSQL prod)

`prisma/schema.prisma` — added to the existing setup (provider switch is
`DATABASE_URL` only, no schema change needed between engines; no migrations
used, per instructions — `prisma db push`):

```prisma
model LoanRequest {
  id              String        @id @default(cuid())
  nationalCode    String
  amount          BigInt                          // IRR; above Int32 (PDF sample 3e9)
  creditId        String
  requestId       String                          // the bank's inquiry requestId
  status          String                          // Zod-validated, not a native enum
  referenceNumber String?
  transactionId   Int?
  mobile          String?                         // the bank's masked mobile
  firstName       String?
  lastName        String?
  creditName      String?
  creditBalance   BigInt?
  note            String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  transactions    Transaction[]
  @@index([nationalCode])
  @@index([requestId])
}

model Transaction {
  id                String      @id @default(cuid())
  loanRequestId     String
  bankTransactionId Int?
  referenceNumber   String?
  step              String                        // PURCHASE | CONFIRM …
  status            String                        // PENDING | COMPLETED | CONFIRMED | FAILED …
  amount            BigInt
  createdAt         DateTime    @default(now())
  loanRequest       LoanRequest @relation(fields: [loanRequestId], references: [id], onDelete: Cascade)
  @@index([loanRequestId])
}
```

Status machine: `INQUIRY → OTP_SENT → PURCHASED → CONFIRMED` (or `FAILED`).
`BigInt` for amounts because the PDF's own transaction-list sample totals
3,000,000,000 IRR — above Int32 and safe within double precision. No
provider-specific types, no native enums, plain indexes (the
`PRISMA_6_STRATEGY.md` §6 checklist). `p-form.jpg` (the reference's loan hero
image) was **copied** out of the read-only reference into `public/img/` (A7
convention; `پلتفرم/` itself remains 0 files changed).

---

## 3. API routes implemented

All under `src/app/api/loan/`, all thin Route Handlers (business logic lives in
`src/modules/loan/services/`, Prisma imported only there — the project's
module contract). Every request is Zod-validated, every bank call is
server-side, and no route ever returns a token or credential.

| Route | Bank endpoint (PDF) | Rate limit / IP | Extra enforcement |
|---|---|---|---|
| `POST /api/loan/inquiry` | `GET /account-balance` (§1-5) | 10/min | national code normalized (fa/ar digits) then validated; persists the INQUIRY row |
| `POST /api/loan/send-otp` | `POST /send-otp` (§1-6) | **5/min** (an SMS costs money) | duplicate guard: a repeat within the bank's own resend cooldown (~120 s) returns the stored mobile, no second call |
| `POST /api/loan/verify` | `POST /purchase` (§1-8) | 10/min | sequence guard: refuses a purchase with no OTP_SENT journey for this national code + requestId |
| `GET /api/loan/status?referenceNumber=` | `GET /inquiry` (§1-13) | 30/min (poll cadence) | reconciles our rows from the bank's step list; ledger dedup |
| `POST /api/loan/confirm` | `POST /confirm` (§1-9) | 10/min | the PDF's precondition is surfaced from the bank's `TRANSACTION_NOT_COMPLETED` |
| `GET /api/loan/transactions?nationalCode=&fromDate=&toDate=&page=&size=` | `GET /transaction-list` (§1-14) | 10/min | the bank's own one-month range cap enforced at our edge; page ≤ 100, size ≤ 50 |

Error envelope: `{ error, fa?, code? }` — 400 (Zod), 405, 429 (rate limit), 503
(bank unreachable), 502 (bank refused, with the bank's own `fa` message and
numeric code forwarded), 500 (generic — internals never leaked).

**Credentials.** `JETPAY_BASE_URL`, `JETPAY_USERNAME`, `JETPAY_PASSWORD`,
`JETPAY_TERMINAL_ID` live only in the gitignored `.env` (a redacted
`.env.example` is added). They are read lazily by
`src/modules/loan/services/jetpay.ts` — the only module that ever holds them
and the raw token — which is never imported by a client component. The browser
only ever talks to `/api/loan/*`.

---

## 4. The UI flow created

**`/loan` (SSR page, `src/app/loan/page.tsx`)** — a faithful port of
`پلتفرم/loan.html`: the shared `.phx` hero (crumbs, title, facts, badge over
the `p-form.jpg` photo), the `.ln-page` grid with the explainer column
("how it works" steps, "who it's for", documents, FAQ with the reference's
`ln-q` details, the bank-terms note) and the request column. The reference's
`.ix-tabs` sibling nav is **not** rendered: all four sibling tabs point past
the boundary (Q4 — no dead links); the middle crumb is plain text for the same
reason. Content strings are the reference's own (fa from the reference markup,
en/ar from `i18n-extra.js`); the four "how it works" steps are adapted to the
digital flow and marked as such in the catalogs (provenance comments in
`messages/{fa,en,ar}.ts`), `lw.*` keys are new UI chrome.

**The wizard** (`src/modules/loan/components/LoanWizard.tsx`) renders inside the
reference's `.ln-form` card on the ported `.ln-*` design (the visual standard:
same radii, input heights, tint surfaces, focus rings, `.ln-ok` success block).
Five screens: national code → credit(s) (balance, name, holder) → amount + OTP
request (masked mobile shown) → OTP → result. The result screen tracks the
bank's protocol: purchase PENDING → polls status (every 3 s, up to 10 tries) →
when PURCHASE COMPLETED, sends confirm → **CONFIRMED** receipt (reference
number, transaction id, amount, localized statuses); if the bank is still
processing when the polling budget ends, the honest "registered, pending
confirmation" state (per §1-9 the bank holds the reservation for 60 minutes);
failures show the bank's own Persian message.

**Lazy loading**: `next/dynamic` with `ssr: false` behind a client wrapper
(`LoanWizardLazy.tsx`) — the wizard's JS is **never** part of any initial page
load; a server-rendered shell + `<noscript>` notice covers the no-JS case.
Build output confirms: `/loan` is **113 kB** First Load JS (vs 103 kB shared
baseline — the page shell itself) and the wizard is a separate on-demand chunk.

**Home page**: the reference's own `#loan` section (`.ln-box`, stepper,
benefits, CTA) restored at the reference's position (HELP → LOAN → SERVICES),
ported verbatim from `index.html`. The side card keeps the reference's
`.ln-form` shape but asks for the **national code** and GET-navigates to
`/loan?nationalCode=…` — a plain HTML form, so **zero client JavaScript** is
added to the home page (build confirms: home stays 148 kB First Load JS; the
section is pure server HTML). The club section stays out (Q3, unchanged).

Also: `/loan` added to `ROUTES` and the sitemap (13 routes), `i-money`,
`i-alert`, `i-hand` icons transcribed verbatim into `Icon.tsx` from the
reference sprite.

---

## 5. Security measures

1. **Credential isolation.** Username/password/terminalId live only in `.env`
   (gitignored; `.env.example` carries placeholders). The single server-side
   module that reads them (`services/jetpay.ts`) is imported only by the loan
   service — never by a client component; the class boundary is documented in
   the file. No credential or raw token appears in any response body, report,
   or test (the tests construct dummy configs and stub the transport).
2. **Token handling.** The bearer JWT is cached server-side, invalidated on a
   401 (single retry), and its `exp` decoded to avoid needless re-auths; a
   malformed token is treated as expired (fail toward re-auth, never toward
   wrongly trusting a cache). The browser never sees the token.
3. **Zod at every API edge** (the project's standing rule): request schemas
   normalize Persian/Arabic digits (the reference's own `en()` rule) and
   reject malformed input before the service or the bank is touched; bank
   responses are parsed against the PDF's documented shapes on arrival, so a
   drifting upstream can never reach a caller unparsed.
4. **Rate limiting per IP** on all six routes (the existing
   `FixedWindowRateLimiter`, same posture as `/api/status`), tightest on
   `send-otp` (5/min — an SMS costs the merchant) and the bank's own
   resend-cooldown dedupe. Verified live: 10 rapid requests → 429.
5. **Duplicate prevention.** Server-side: the OTP-send dedupe window; the
   sequence guard (no purchase without an OTP step); one DB row per journey
   (inquiry row advanced, not duplicated). Client-side: in-flight submit
   guards on every step button.
6. **Data minimisation.** The inquiry drops the bank's `account_number` from
   the public credit view (never leaves the service layer); the wizard only
   shows what the patient needs to recognize their own credit.
7. **Timeouts.** Every bank call is bounded (`AbortSignal.timeout`, 15 s) and
   mapped to a 503, not a hang.

---

## 6. Verification

| Gate | Result |
|---|---|
| `tsc --noEmit` | **clean (exit 0)** |
| Vitest | **46 files / 339 tests, all passing** — of which 101 new loan tests (13 files, see below); the pre-existing 232 frozen tests green |
| `next build` | **exit 0, zero CSS warnings**, CSS hash `d620b667e4c95023.css` (85 KB — the ported `.ln-*`/`.ix-*` loan CSS), 18 routes |
| Bundle | home 148 kB FLS (unchanged client budget; the section is server HTML); `/loan` 113 kB FLS with the wizard lazy-split |
| Rate limits (live, production server I started and stopped) | inquiry/verify: 10 × 400 → then **429**; `/api/status` control still 60 → 429 (the pattern is sound) |
| Live error paths (same server) | bad national code → 400; unreachable bank → **503** with the fa message and `code: 0`; missing/oversized inputs → 400; > 1-month transaction range → 400 |
| Rendered HTML (live) | home carries `id="loan"`, `.ln-box`, `وام درمانی` ×8, the GET form `action="/loan"`; `/loan` carries the wizard shell (`aria-busy` placeholder), `<noscript>` notice, FAQ |
| Reference preservation | `پلتفرم/` — **0 files changed** (git status clean for the tree; `p-form.jpg` was copied, never modified) |
| Baseline freeze | refrozen (44 files / 334 tests) with the reason recorded in `docs/reports/PHASE_2_BASELINE.md` §"Refreeze — 2026-11-18"; `baseline-freeze.mjs` verify exits 0; the integration test is an allowed post-freeze addition |
| Machine conditions | general internet reachable; the sandbox host specifically is not (below) |

**New tests (101, in 13 files):** `jetpay.test.ts` (17 — the documented
request/response contract per endpoint, error envelope, 401 retry, timeout
mapping, JWT expiry decoding), `loanService.test.ts` (14 — persistence machine,
dedupe, sequence guard, status reconciliation, ledger), `loanIntegration.test.ts`
(1 — the full stack over a **real local HTTP server** implementing the bank's
documented contract: real `fetch` transport, Bearer on every call, the exact
purchase body, the full ledger PURCHASE PENDING→COMPLETED + CONFIRM), six route
tests (34 — Zod rejection, rate limits, error mapping), `loanSchemas.test.ts`
(12), `loanQueries.test.ts` (12 — client guards, envelope mapping, message
preference), `LoanWizard.test.tsx` (5 — end-to-end flow with Persian-digit
input, validation guards, bank error display, en locale), `/loan` page test
(6 — SSR completeness, no-JS notice, lazy boundary).

**Two existing test files changed (the reason for the refreeze):**
`src/app/page.test.tsx` (the Q3 loan-exclusion pin, rewritten as
loan-section-present / club-still-absent) and `src/app/sitemap.test.ts`
(twelve → thirteen routes). The club half of Q3 is still asserted.

### Sandbox verification

The sandbox (`sandbox-jetpay.simotechtest.ir`) is **unreachable from this build
machine**: DNS resolution and ICMP both time out while general internet works
(`example.com` 200), so the host or the network path is blocked — not the
integration. What was done instead, in order of strength:

1. `loanIntegration.test.ts` runs the *real* client code against a real local
   HTTP server implementing the PDF's documented endpoints — proving the wire
   format, transport, parsing, and persistence as a closed system.
2. Every bank response shape is Zod-parsed against the PDF's own samples, so
   contract drift fails loudly.
3. `scripts/loan-sandbox-smoke.mjs` is provided for an operator on a network
   that can reach the host: `node scripts/loan-sandbox-smoke.mjs inquiry
   4533654504` authenticates and runs the credit inquiry through the real
   client, printing nothing sensitive (the token is redacted in output). The
   mutating steps (send-otp → purchase → confirm) need a live OTP and are
   printed as documented commands to drive from `/loan`.
4. The one live end-to-end path verified against the deployed routes is the
   unreachable-bank path (503 with the bank-unreachable message), which is the
   correct behaviour when the sandbox is down.

**The feature is wired and correct to the document; live sandbox confirmation
is pending a network that can reach it.**

### Performance-budget note

The sites's existing CWV gates (a11y/CWV scans via CDP) could not be re-run in
this session: the headless Chrome the gates need was reaped earlier by the
harness for system-memory pressure and was not restarted. What is asserted
instead: the build output (home's client JS unchanged in size and composition —
the new section is pure server HTML; `/loan`'s wizard is a lazy chunk), plus
the architecture of the additions (zero client JS on home; `ssr: false` island
on `/loan`; routes are server-only). The a11y posture of the new UI follows the
project's standard (semantic labels, `aria-invalid`/`role="alert"`, `<noscript>`
notice, keyboard-operable native form controls) and was reviewed in code, but
no automated axe pass was run on the new route.

---

## 7. How to test

```
# 1. Environment (one time)
cp .env.example .env   # then fill JETPAY_* from kalano-sandbox.txt
npx prisma generate
npx prisma db push     # creates/updates the SQLite dev db (no migrations)

# 2. Automated tests (all green: 339/339)
npm test               # vitest
npm run typecheck      # tsc --noEmit

# 3. Local run
npm run build && npx next start -p 3100
# home → the #loan section → /loan → the wizard
# API smoke (against an unreachable bank, expect 503; bad input, expect 400):
curl -X POST localhost:3100/api/loan/inquiry -H 'Content-Type: application/json' -d '{"nationalCode":"4533654504"}'

# 4. Live sandbox (requires network access to the sandbox host)
node scripts/loan-sandbox-smoke.mjs inquiry 4533654504
```

No admin panels, doctor panels, or patient accounts were built — strictly the
public-facing flow, as instructed.

## 8. Confirmation

**No commits were made.** All changes are uncommitted in the working tree
(branch `master`, nothing staged) for the owner's review: 19 modified files, 9
new paths (`src/modules/loan/`, `src/app/api/loan/`, `src/app/loan/`,
`src/styles/globalCss/loan.css`, `prisma/`, `public/img/p-form.jpg`,
`scripts/loan-sandbox-smoke.mjs`, `.env.example`, plus the owner-provided
`*.pdf`, `kalano-sandbox.txt`, `DB-CHECK.txt` which were already present).
`.env`, `prisma/*.db` and scratch files stay gitignored.

**STOP — awaiting the owner's instructions.**
