---
status: ready
---

# TASKS — Astryx RTL Admin Dashboard (cycle 001, Route S / lite)

Derived from SPEC.md (kernel journey + §9 acceptance criteria) and ARCHITECTURE.md — no PLAN.md this cycle. Execution order = file order. Walking-skeleton tasks (0–5) come first and may not be reordered after feature tasks.

Task completions done-mark against `specs/001-core/evidence/task-N.txt` (Verification Machinery, WORKFLOW.md). `yarn verify` (`tsc --noEmit && eslint . && vitest run`) and, where e2e criteria exist, `yarn test:e2e` must pass before a done-mark lands. Human waiver for Task 0 in this lite cycle: automated accessibility, dependency-audit, and secret-scan gates are not required.

Context packs are hints predicted before code exists — implementation sessions verify against real files. Interfaces (consumes/produces) are firmer: contract changes route through ARCHITECTURE.md, never task improvisation.

---

## Task 0 — Scaffold: Vite + React + TS strict + astryx + harnesses

Objective: boot a runnable empty app with the full toolchain, exact dependency versions from ARCHITECTURE §2 (frozen lockfile), lint-over-prose rules from CONVENTIONS.md, and both test harnesses wired. `dir="rtl"` `lang="fa"` document, astryx `theme-neutral` CSS, self-hosted Vazirmatn. No feature logic. Run command documented in CONVENTIONS.md/README.

Context pack (boundary — Task 0): ARCHITECTURE §1–§3, CONVENTIONS.md (lint list, test strategy), AGENTS.md astryx rules, DESIGN.md tokens section.

```toml
id = 0
type = "scaffold"
deps = []
skeleton = true
files = [
  "package.json", "vite.config.ts", "tsconfig.json", "eslint.config.js",
  "vitest.config.ts", "playwright.config.ts", "index.html",
  "src/main.tsx", "src/app/router.tsx", "e2e/smoke.spec.ts", "README.md",
]
produces = ["app entry: src/main.tsx mounts router under dir=rtl lang=fa with astryx theme-neutral css"]

[[criteria]]
text = "open the app → document is dir=rtl lang=fa with Vazirmatn applied"
layer = "e2e"
gate = 1

[[criteria]]
text = "lint rejects a fixture file importing localStorage outside lib/storage.ts and date-fns-jalali outside lib/date.ts"
layer = "unit"

[[criteria]]
text = "smoke contract: rendering the router root under jsdom yields a document with dir=rtl and lang=fa"
layer = "contract"
```

Difficulty: medium (dependency matrix + StyleX/astryx Vite wiring).

- **Done:** `e841d04` — evidence `specs/001-core/evidence/task-0.txt`

## Task 1 — `lib/` layer: storage adapter, date, digits, bidi

Objective: the four shared modules per ARCHITECTURE §1/§4a. `storage.ts` implements the full persistence contract: versioned decode (`astryx-dash:v`), per-key decoders, per-record drop for users array, corruption reset + `recovered` flag, session-wide memory-only failover on first failed write, `clearAll()` for the S10 escape hatch. `date.ts` wraps `date-fns-jalali` (ISO Gregorian storage ⇄ Jalali display). `digits.ts` Persian/Latin digit conversion. `bidi.ts` Latin-in-RTL isolation.

Context pack (boundary): ARCHITECTURE §1 (dates/digits), §4, §4a; CONVENTIONS test strategy.

```toml
id = 1
type = "feature"
deps = [0]
skeleton = true
files = [
  "src/lib/storage.ts", "src/lib/date.ts", "src/lib/digits.ts", "src/lib/bidi.ts",
  "src/lib/storage.test.ts", "src/lib/date.test.ts", "src/lib/digits.test.ts", "src/lib/bidi.test.ts",
]
produces = [
  "lib/date.formatJalali(iso: string): string",
  "lib/date.jalaliToIso(j: JalaliDate): string",
  "lib/digits.toPersianDigits(s: string): string",
  "lib/digits.toLatinDigits(s: string): string",
  "lib/bidi.isolate(s: string): string",
  "lib/storage.read<T>(key: StorageKey): T | null",
  "lib/storage.write(key: StorageKey, value: unknown): void",
  "lib/storage.clearAll(): void",
]

[[criteria]]
text = "digit round-trip: toPersianDigits('1404') = '۱۴۰۴'; toLatinDigits normalizes mixed Persian/Latin input to Latin"
layer = "unit"

[[criteria]]
text = "Jalali conversion honors Esfand month lengths across leap and non-leap years (29 vs 30), round-trips ISO ⇄ Jalali losslessly, and rejects impossible Jalali dates"
layer = "unit"

[[criteria]]
text = "corrupt JSON or wrong shape in a key → read returns default, key reset, recovered flag set; invalid user records dropped individually while valid ones survive"
layer = "unit"

[[criteria]]
text = "first failed write (quota/security error) flips the session to memory-only: subsequent writes across all keys skip persistence, hydrated in-memory data intact"
layer = "unit"

[[criteria]]
text = "shape test imports every produced signature and asserts return shapes (formatJalali → Persian-digit Jalali string; read → decoded value or null; clearAll removes all astryx-dash:* keys)"
layer = "contract"
```

Difficulty: medium.

- **Done:** `16ae7e0` — evidence `specs/001-core/evidence/task-1.txt`

## Task 2 — Zustand stores: auth, theme, users (+ fixtures, seeding)

Objective: the three stores per ARCHITECTURE §5, hydrating from `lib/storage` on boot, write-through persistence. `usersStore` enforces the `UserInput` write model (§4): required fields, email shape + uniqueness, real non-future Jalali birth date, defaults, store-generated `id`/`createdAt`; Persian `FieldErrors` via `Result` — never throws. Seeding rule F2: fixtures (realistic Persian names, Latin emails) seed only when the `users` key is absent; persisted `[]` never reseeds.

Context pack (boundary): ARCHITECTURE §4, §4a, §5; CONVENTIONS error handling.

```toml
id = 2
type = "feature"
deps = [1]
skeleton = true
files = [
  "src/features/auth/authStore.ts", "src/features/auth/authStore.test.ts",
  "src/app/shell/themeStore.ts", "src/app/shell/themeStore.test.ts",
  "src/features/users/usersStore.ts", "src/features/users/usersStore.test.ts",
  "src/features/users/fixtures.ts",
]
consumes = [
  "lib/storage.read<T>(key: StorageKey): T | null",
  "lib/storage.write(key: StorageKey, value: unknown): void",
  "lib/date.jalaliToIso(j: JalaliDate): string",
  "lib/digits.toLatinDigits(s: string): string",
]
produces = [
  "authStore: login(credentials): void; logout(): void; session; updateProfile(input): Result",
  "themeStore: mode: 'light'|'dark'; toggle(): void",
  "usersStore: users: User[]; create(input: UserInput): Result<User, FieldErrors>; update(id, input): Result; remove(id): void; query({search, sort, filter, page}): User[]",
]

[[criteria]]
text = "create/update validate UserInput: missing required fields, malformed or duplicate email, invalid or future Jalali birth date each return Persian FieldErrors and persist nothing; valid input applies defaults and generates id/createdAt"
layer = "unit"

[[criteria]]
text = "absent users key seeds Persian fixtures; persisted empty array [] hydrates as empty and never reseeds"
layer = "unit"

[[criteria]]
text = "query: search matches Persian text and normalizes Persian/Latin digits; sort and pagination are stable over fixtures"
layer = "unit"

[[criteria]]
text = "login always succeeds and writes session (profile seeded from email); logout clears it; updateProfile is the sole owner of displayName/email"
layer = "unit"

[[criteria]]
text = "reload the app → session, dark mode, and created user persist"
layer = "e2e"
gate = 1

[[criteria]]
text = "shape test calls each produced store API exactly per ARCHITECTURE §5 and asserts Result/FieldErrors shapes and User invariants"
layer = "contract"
```

Difficulty: medium-high (validation + seeding + hydration edge cases).

- **Done:** `f521c49` — evidence `specs/001-core/evidence/task-2.txt`

## Task 3 — SPIKE: astryx RTL correctness under `dir="rtl"`

Objective: decide ARCHITECTURE §1 spike (a)/(b). Render astryx AppShell + SideNav + Table + a dialog under `dir="rtl"` at 1280–1920 px; Playwright screenshot + overflow assertions. Outcome recorded in ARCHITECTURE Decision log. If (b) — RTL broken — STOP: feasibility re-check before any shell work.

```toml
id = 3
type = "spike"
deps = [0]
skeleton = true
files = ["e2e/rtl-spike.spec.ts", "src/app/shell/RtlProbe.tsx"]

[[criteria]]
text = "resize 1280 → 1920 px → shell layout stays mirrored RTL with no horizontal overflow"
layer = "e2e"
gate = 1
```

Difficulty: low (but decision-critical).

- **Done:** `e6db655` — evidence `specs/001-core/evidence/task-3.txt`

## Task 4 — App shell, router, guards, `fa.json`, global banners

Objective: AppShell + SideNav + header (dark-mode toggle, logout, displayName) framing S4–S8; `createBrowserRouter` with auth guard (no session → S1; session → S4 default), lazy route boundaries, placeholder overview route (real S4 lands in task 11); author `locale/fa.json` astryx Persian catalog; shell banners for `storage.recovered` and memory-only failover (once per page lifetime, Persian wording per UX.md).

Context pack (boundary): ARCHITECTURE §3, §4a (banners), §5; UX.md shell + global states + navigation map; DESIGN.md.

```toml
id = 4
type = "feature"
deps = [2, 3]
skeleton = true
files = [
  "src/app/router.tsx", "src/app/shell/AppShell.tsx", "src/app/shell/SideNav.tsx",
  "src/app/shell/Header.tsx", "src/app/shell/StorageBanner.tsx", "src/locale/fa.json",
  "src/app/shell/AppShell.test.tsx",
]
consumes = [
  "authStore: login(credentials): void; logout(): void; session; updateProfile(input): Result",
  "themeStore: mode: 'light'|'dark'; toggle(): void",
]

[[criteria]]
text = "guard: no session → any app route redirects to login; with session → default route is overview; logout from header clears session and returns to login"
layer = "integration"

[[criteria]]
text = "astryx-internal strings render Persian via fa.json (spot-check: table pagination, dialog buttons, empty states)"
layer = "integration"

[[criteria]]
text = "recovered flag → one-time banner 'داده‌های ذخیره‌شده بازنشانی شد'; memory-only failover → one-time warning stating a reload loses changes"
layer = "integration"

[[criteria]]
text = "click کاربران in the SideNav → users route renders inside the shell"
layer = "e2e"
gate = 1

[[criteria]]
text = "toggle dark mode in the header → whole app re-themes"
layer = "e2e"
gate = 1

[[criteria]]
text = "logout from the header → back to the login page, session cleared"
layer = "e2e"
gate = 2

[[criteria]]
text = "restart with corrupted storage: write garbage into astryx-dash:users, reload → recovery banner 'داده‌های ذخیره‌شده بازنشانی شد', fixtures reseeded, no crash"
layer = "e2e"
gate = 2
```

Difficulty: medium-high.

- **Done:** `be40fb9` — evidence `specs/001-core/evidence/task-4.txt`

## Task 5 — S1 login page (fake auth)

Objective: UX S1 — bare full-page RTL Persian login, Vazirmatn, astryx components; empty-field inline Persian validation; any credentials → `authStore.login` → route to overview.

```toml
id = 5
type = "feature"
deps = [4]
skeleton = true
files = ["src/features/auth/LoginPage.tsx", "src/features/auth/LoginPage.test.tsx"]
consumes = ["authStore: login(credentials): void; logout(): void; session; updateProfile(input): Result"]

[[criteria]]
text = "empty fields → inline Persian messages, no navigation, nothing stored"
layer = "integration"

[[criteria]]
text = "open the app logged out → Persian RTL login page"
layer = "e2e"
gate = 1

[[criteria]]
text = "submit any credentials → land inside the app shell on the overview route"
layer = "e2e"
gate = 1
```

Difficulty: low.

- **Done:** `3d2e63f` — evidence `specs/001-core/evidence/task-5.txt`

## Task 6 — S5 users table

Objective: UX S5 — astryx data table over `usersStore.query`: search, sort, filter, paginate; Persian digits in pagination; Latin emails via `bidi.isolate`; empty states per UX.md (delete-all CTA, zero-result search + clear action); row actions edit/delete (wired fully in task 8).

```toml
id = 6
type = "feature"
deps = [4]
files = ["src/features/users/UsersTable.tsx", "src/features/users/UsersPage.tsx", "src/features/users/UsersTable.test.tsx"]
consumes = [
  "usersStore: users: User[]; create(input: UserInput): Result<User, FieldErrors>; update(id, input): Result; remove(id): void; query({search, sort, filter, page}): User[]",
  "lib/digits.toPersianDigits(s: string): string",
  "lib/bidi.isolate(s: string): string",
  "lib/date.formatJalali(iso: string): string",
]

[[criteria]]
text = "zero-result search → 'نتیجه‌ای یافت نشد' with clear-search action; all rows deleted → empty state with 'افزودن کاربر' CTA"
layer = "integration"

[[criteria]]
text = "Latin emails render bidi-isolated inside RTL cells (character order intact); birth dates render Jalali with Persian digits"
layer = "integration"

[[criteria]]
text = "sort, filter, and pagination operate over Persian fixture data; pagination digits are Persian"
layer = "integration"

[[criteria]]
text = "users table shows seeded Persian fixture data; search finds the created user"
layer = "e2e"
gate = 1
```

Difficulty: medium.

- **Done:** `c90296c` — evidence `specs/001-core/evidence/task-6.txt`

## Task 7 — Jalali picker (buy spike + component)

Objective: execute ARCHITECTURE §1 picker spike, leading candidate `react-day-picker` @ 10.0.1 + `@daypicker/persian` — style with astryx tokens via `classNames`/custom components, Vazirmatn, Persian digits, dark mode. Wrap as `<JalaliPicker>`. Record spike outcome in ARCHITECTURE Decision log; if buy fails RTL/styling, STOP — path (b) requires the keyboard/ARIA contract written first (plan patch).

Context pack (boundary): ARCHITECTURE §1 picker spike, §2 table row, §4 UserInput; DESIGN.md tokens; UX S6.

```toml
id = 7
type = "feature"
deps = [4]
files = ["src/components/jalali-picker/JalaliPicker.tsx", "src/components/jalali-picker/JalaliPicker.test.tsx"]
consumes = [
  "lib/digits.toPersianDigits(s: string): string",
]
produces = ["<JalaliPicker value={JalaliDate | null} onChange={(d: JalaliDate) => void} />"]

[[criteria]]
text = "Esfand renders 29 or 30 days matching date-fns-jalali leap-year math"
layer = "integration"

[[criteria]]
text = "keyboard-only selection: RTL-correct arrow keys move focus in the grid, PageUp/Down change months, Enter selects, Esc closes"
layer = "integration"

[[criteria]]
text = "picker styled via astryx tokens with Persian digits, correct in dark mode (no raw hex/px)"
layer = "integration"

[[criteria]]
text = "shape test renders <JalaliPicker> per the produced signature: onChange delivers a JalaliDate for the clicked day"
layer = "contract"

[[criteria]]
text = "pick a Jalali birth date from the picker, navigating into Esfand"
layer = "e2e"
gate = 1
```

Difficulty: medium.

- **Done:** `cffe280` — evidence `specs/001-core/evidence/task-7.txt`

## Task 8 — S6 user form + S7 delete confirm dialog

Objective: UX S6/S7 — create/edit form (astryx form components, `<JalaliPicker>` for birth date), rendering store `FieldErrors` inline in Persian; edit prefills, missing id redirects to S5; delete confirm dialog over the table (cancel = no change, confirm = remove). Wire S5 row actions.

```toml
id = 8
type = "feature"
deps = [6, 7]
files = [
  "src/features/users/UserFormPage.tsx", "src/features/users/DeleteUserDialog.tsx",
  "src/features/users/UserFormPage.test.tsx", "src/features/users/DeleteUserDialog.test.tsx",
]
consumes = [
  "usersStore: users: User[]; create(input: UserInput): Result<User, FieldErrors>; update(id, input): Result; remove(id): void; query({search, sort, filter, page}): User[]",
  "<JalaliPicker value={JalaliDate | null} onChange={(d: JalaliDate) => void} />",
]

[[criteria]]
text = "store FieldErrors render inline per field in Persian; form inputs accept Persian and Latin digits"
layer = "integration"

[[criteria]]
text = "edit route prefills the form from the store; unknown id redirects to the users table"
layer = "integration"

[[criteria]]
text = "delete dialog: cancel closes with no change; confirm removes the row and closes"
layer = "integration"

[[criteria]]
text = "submit the new user → returned to the table, new row visible"
layer = "e2e"
gate = 1

[[criteria]]
text = "edit a user → row updated; delete a user via confirm dialog → row gone"
layer = "e2e"
gate = 1

[[criteria]]
text = "submit the form with a duplicate email and a future Jalali birth date → inline Persian errors, nothing saved"
layer = "e2e"
gate = 1
```

Difficulty: medium.

- **Done:** `1352587` — evidence `specs/001-core/evidence/task-8.txt`

## Task 9 — DEMO GATE 1: auth + users CRUD journey

Journey walked by a human in a fresh browser profile (disposable localStorage — fail-closed: never walk against a profile holding real data; there is no production backend). Playwright covers the same journey with fresh browser contexts. Completion artifact: walkthrough result recorded in the done-mark + `specs/001-core/evidence/task-9.txt`; screenshots optional.

Crystallization step (in this gate session, journey loaded): inspect `e2e/`; every journey step below, including the unglamorous step, green on the Playwright harness — reuse/extend existing specs, create only for uncovered behavior. Done-mark quotes coverage paths (`` coverage `e2e/...` ``).

Context pack: UX.md kernel flow 1–2, 4–6 + secondary flows; SPEC §9 criteria rows 1–5, 7; ARCHITECTURE §6 traceability.

```toml
id = 9
type = "gate"
deps = [0, 1, 2, 3, 4, 5, 6, 7, 8]
files = ["e2e/gate-1.spec.ts"]

[gate]
n = 1
release = false
launch = "yarn dev — open in a fresh browser profile / Playwright fresh context (empty localStorage; fixtures self-seed on absent users key)"
seed = "none needed — fixtures auto-seed when astryx-dash:users is absent (ARCHITECTURE §4 F2)"
unglamorous = "invalid input: submit the form with a duplicate email and a future Jalali birth date → inline Persian errors, nothing saved"

[[gate.journey]]
step = "open the app → document is dir=rtl lang=fa with Vazirmatn applied"
task = 0

[[gate.journey]]
step = "open the app logged out → Persian RTL login page"
task = 5

[[gate.journey]]
step = "submit any credentials → land inside the app shell on the overview route"
task = 5

[[gate.journey]]
step = "click کاربران in the SideNav → users route renders inside the shell"
task = 4

[[gate.journey]]
step = "users table shows seeded Persian fixture data; search finds the created user"
task = 6

[[gate.journey]]
step = "pick a Jalali birth date from the picker, navigating into Esfand"
task = 7

[[gate.journey]]
step = "submit the new user → returned to the table, new row visible"
task = 8

[[gate.journey]]
step = "edit a user → row updated; delete a user via confirm dialog → row gone"
task = 8

[[gate.journey]]
step = "toggle dark mode in the header → whole app re-themes"
task = 4

[[gate.journey]]
step = "reload the app → session, dark mode, and created user persist"
task = 2

[[gate.journey]]
step = "resize 1280 → 1920 px → shell layout stays mirrored RTL with no horizontal overflow"
task = 3

[[gate.journey]]
step = "submit the form with a duplicate email and a future Jalali birth date → inline Persian errors, nothing saved"
task = 8

[[criteria]]
text = "every gate-1 journey step, including the unglamorous step, is covered and green on the Playwright harness (e2e/*.spec.ts); coverage paths quoted in the done-mark"
layer = "e2e"
gate = 1
```

No feature task past this point starts before gate 1 is Done (walkthrough recorded + coverage green).

- **GATE 1 WALKED — PASS** (2026-07-29, human) — evidence `specs/001-core/evidence/task-9.txt`. coverage `e2e/gate-1.spec.ts` `e2e/smoke.spec.ts` `e2e/rtl-spike.spec.ts`

## Task 10 — `<Chart>` wrapper (ECharts lifecycle contract §5a)

Objective: hand-rolled wrapper owning the full lifecycle: lazy `import('echarts')` with skeleton pending state and Persian error + retry on rejection; init (canvas, `useDirtyRect`) / dispose; `ResizeObserver` → resize; `setOption(option, { notMerge: true })` on data change; theme derived from astryx CSS custom properties at runtime, dispose + re-init on mode change; empty series → astryx empty-state overlay; injects Jalali axis + Persian-digit label formatters.

Context pack (boundary): ARCHITECTURE §5a (the whole contract), §1 charts; DESIGN.md chart theming.

```toml
id = 10
type = "feature"
deps = [9]
files = ["src/components/chart/Chart.tsx", "src/components/chart/theme.ts", "src/components/chart/Chart.test.tsx"]
consumes = [
  "themeStore: mode: 'light'|'dark'; toggle(): void",
  "lib/date.formatJalali(iso: string): string",
  "lib/digits.toPersianDigits(s: string): string",
]
produces = ["<Chart buildOption={(theme: ChartTheme) => EChartsOption} data={TSeries} />"]

[[criteria]]
text = "instance disposed on unmount — no leaked ECharts instances across mount/unmount cycles"
layer = "integration"

[[criteria]]
text = "themeStore.mode change → dispose + re-init with theme re-derived from current astryx CSS custom properties (changing a token variable changes the derived theme)"
layer = "integration"

[[criteria]]
text = "echarts import rejection → inline Persian error with retry button; no crash to the error boundary"
layer = "integration"

[[criteria]]
text = "empty series → astryx empty-state overlay instead of a blank canvas"
layer = "integration"

[[criteria]]
text = "shape test renders <Chart> per the produced signature; buildOption receives a ChartTheme and axis labels pass through Jalali/Persian-digit formatters"
layer = "contract"

[[criteria]]
text = "charts re-theme when dark mode toggles"
layer = "e2e"
gate = 2
```

Difficulty: high (lifecycle + runtime theming).

- **Done:** `cf4e847` — evidence `specs/001-core/evidence/task-10.txt`

## Task 11 — S4 overview dashboard

Objective: UX S4 — stat card row (top-start) computed from `usersStore` + fixture-derived series; ECharts charts through `<Chart>`; Jalali axis labels, Persian digits; loading skeletons while lazy chunk loads; zero data → cards show ۰ with muted note.

```toml
id = 11
type = "feature"
deps = [10]
files = ["src/features/overview/OverviewPage.tsx", "src/features/overview/statCards.ts", "src/features/overview/chartConfigs.ts", "src/features/overview/OverviewPage.test.tsx"]
consumes = [
  "usersStore: users: User[]; create(input: UserInput): Result<User, FieldErrors>; update(id, input): Result; remove(id): void; query({search, sort, filter, page}): User[]",
  "<Chart buildOption={(theme: ChartTheme) => EChartsOption} data={TSeries} />",
  "lib/digits.toPersianDigits(s: string): string",
]

[[criteria]]
text = "stat cards derive from usersStore with Persian digits; zero data → cards show ۰ with a muted note"
layer = "integration"

[[criteria]]
text = "charts show skeleton placeholders while the lazy ECharts chunk loads"
layer = "integration"

[[criteria]]
text = "overview shows stat cards and charts with Jalali axis labels and Persian digits"
layer = "e2e"
gate = 2
```

Difficulty: medium.

- **Done:** `d2fd305` — evidence `specs/001-core/evidence/task-11.txt`

## Task 12 — S2 register + S3 forgot-password (UI-only)

Objective: UX S2/S3 — bare full-page forms, per-field inline Persian validation, no real submission. Register success routes to S1; forgot shows a success note + link back to S1. Links wired from S1.

```toml
id = 12
type = "feature"
deps = [9]
files = ["src/features/auth/RegisterPage.tsx", "src/features/auth/ForgotPasswordPage.tsx", "src/features/auth/RegisterPage.test.tsx", "src/features/auth/ForgotPasswordPage.test.tsx"]

[[criteria]]
text = "register: per-field Persian validation; valid submit routes to the login page"
layer = "integration"

[[criteria]]
text = "forgot password: empty email → inline Persian message; submit shows a success note with a link back to login"
layer = "integration"
```

Difficulty: low.

- **Done:** `5b82996` — evidence `specs/001-core/evidence/task-12.txt`

## Task 13 — S8 settings page

Objective: UX S8 — profile section editing `displayName` (and email) through `authStore.updateProfile` (sole profile owner — no settings store); appearance section: theme-mode control bound to `themeStore` + brand note pointing at the theming README. Inline validation on name; changes persist immediately.

```toml
id = 13
type = "feature"
deps = [9]
files = ["src/features/settings/SettingsPage.tsx", "src/features/settings/SettingsPage.test.tsx"]
consumes = [
  "authStore: login(credentials): void; logout(): void; session; updateProfile(input): Result",
  "themeStore: mode: 'light'|'dark'; toggle(): void",
]

[[criteria]]
text = "empty name → inline Persian validation from updateProfile Result; valid edit updates the shell header displayName immediately"
layer = "integration"

[[criteria]]
text = "change the profile name in settings → header updates; the change survives a reload"
layer = "e2e"
gate = 2
```

Difficulty: low.

- **Done:** `1e0f6c5` — evidence `specs/001-core/evidence/task-13.txt`

## Task 14 — S9 404 + S10 500 error boundary with clear-state escape

Objective: UX S9/S10 — unknown route → static 404 with link back to overview; route-level error boundary → 500 page with two actions: reload, and "پاک‌کردن داده‌های ذخیره‌شده و شروع دوباره" via `lib/storage.clearAll()` then reload (corrupt-state crash-loop escape, ARCHITECTURE §4a).

```toml
id = 14
type = "feature"
deps = [9]
files = ["src/pages/errors/NotFoundPage.tsx", "src/pages/errors/ErrorFallback.tsx", "src/pages/errors/errors.test.tsx"]
consumes = ["lib/storage.clearAll(): void"]

[[criteria]]
text = "a render error in a route shows the 500 fallback; its clear-data action calls storage.clearAll (all astryx-dash:* keys removed) then reloads"
layer = "integration"

[[criteria]]
text = "visit an unknown URL → Persian 404 page with a link back to the overview"
layer = "e2e"
gate = 2
```

Difficulty: low.

- **Done:** `d174f9b` — evidence `specs/001-core/evidence/task-14.txt`

## Task 15 — Developer theming: re-brand path + README

Objective: kernel promise 5 — document fork-and-rebrand through `astryx theme`/tokens in README (never override `--color-*` in `:root`); verify no component-code edits are needed anywhere: chart theme reads tokens at derive time; shell and buttons restyle natively because no app code hardcodes colors (lint bans raw hex/px — CONVENTIONS.md — plus a grep-asserted test across `src/`). SPEC §9's shell/buttons half of the re-theme criterion is witnessed in the release-gate walkthrough observation (task 16).

```toml
id = 15
type = "feature"
deps = [10]
files = ["README.md", "src/components/chart/theme.test.ts"]

[[criteria]]
text = "changing an astryx accent token variable re-derives the chart theme with the new color; grep-asserted test proves no hardcoded color literal anywhere under src/ (charts, shell, buttons all token-driven)"
layer = "integration"
```

Difficulty: low.

## Task 16 — RELEASE GATE: kernel journey, release build

Kernel journey (SPEC.md) walked by a human against the production composition: release build served by preview, fresh browser profile (disposable localStorage — fail-closed: no real data; no backend exists). Playwright runs the same journey against the preview server. No external systems (ARCHITECTURE §6) → no production-composition proof task required. Walkthrough additionally observes the task-15 re-brand: run `astryx theme` accent change, rebuild, confirm shell/buttons/charts restyle with zero component edits (recorded as an observation in the done-mark). Completion artifact: walkthrough result + `specs/001-core/evidence/task-16.txt`.

Crystallization step: every journey step below, including the unglamorous step, green on Playwright against the preview build; coverage paths quoted in the done-mark. The launch command's `yarn build` discharges SPEC §9's "TS strict, zero errors" row — a gate condition by definition, never a task criterion.

Context pack: SPEC.md kernel journey + §9 (all rows); ARCHITECTURE §6; UX.md kernel flow.

```toml
id = 16
type = "gate"
deps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
files = ["e2e/release-gate.spec.ts"]

[gate]
n = 2
release = true
launch = "yarn build && yarn preview — fresh browser profile / Playwright fresh context (empty localStorage)"
seed = "none needed — fixtures auto-seed when astryx-dash:users is absent (ARCHITECTURE §4 F2)"
unglamorous = "restart with corrupted storage: write garbage into astryx-dash:users, reload → recovery banner 'داده‌های ذخیره‌شده بازنشانی شد', fixtures reseeded, no crash"

[[gate.journey]]
step = "open the app logged out → Persian RTL login page"
task = 5

[[gate.journey]]
step = "submit any credentials → land inside the app shell on the overview route"
task = 5

[[gate.journey]]
step = "overview shows stat cards and charts with Jalali axis labels and Persian digits"
task = 11

[[gate.journey]]
step = "click کاربران in the SideNav → users route renders inside the shell"
task = 4

[[gate.journey]]
step = "pick a Jalali birth date from the picker, navigating into Esfand"
task = 7

[[gate.journey]]
step = "submit the new user → returned to the table, new row visible"
task = 8

[[gate.journey]]
step = "toggle dark mode in the header → whole app re-themes"
task = 4

[[gate.journey]]
step = "charts re-theme when dark mode toggles"
task = 10

[[gate.journey]]
step = "reload the app → session, dark mode, and created user persist"
task = 2

[[gate.journey]]
step = "change the profile name in settings → header updates; the change survives a reload"
task = 13

[[gate.journey]]
step = "visit an unknown URL → Persian 404 page with a link back to the overview"
task = 14

[[gate.journey]]
step = "logout from the header → back to the login page, session cleared"
task = 4

[[gate.journey]]
step = "restart with corrupted storage: write garbage into astryx-dash:users, reload → recovery banner 'داده‌های ذخیره‌شده بازنشانی شد', fixtures reseeded, no crash"
task = 4

[[criteria]]
text = "every release-gate journey step, including the unglamorous corrupted-storage step, is covered and green on Playwright against the preview build; coverage paths quoted in the done-mark"
layer = "e2e"
gate = 2
```

v1 ships only after this gate is WALKED — PASS.
