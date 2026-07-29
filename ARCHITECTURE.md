# ARCHITECTURE — Astryx RTL Admin Dashboard (lite)

Living doc — single current truth. Patch, never fork.

## 1. Stack commitment

- **Build:** Vite 8 + `@vitejs/plugin-react`, TypeScript 5.9 strict (`"strict": true`, no `any`), Yarn.
- **App:** React 19 SPA, `react-router` 8 (data-router, `createBrowserRouter`).
- **UI:** `@astryxdesign/core` 0.1.9 + `theme-neutral`, per AGENTS.md rules (no raw div layout, tokens everywhere). StyleX runtime peer installed.
- **State:** Zustand 5 — three stores: `authStore` (session + profile), `themeStore`, `usersStore`. Stores are always the in-memory source of truth; localStorage is a write-through mirror behind a shared `storage` adapter (see §4a persistence contract).
- **Dates:** `date-fns-jalali` everywhere; **no direct `Date` formatting in components** — all through `src/lib/date.ts`.
- **Digits:** `src/lib/digits.ts` — `toPersianDigits` for display, `toLatinDigits` normalization on input; storage always Latin.
- **Charts:** ECharts 6, lazy (`React.lazy` route-level + dynamic `import('echarts')`), hand-rolled `<Chart>` wrapper; theme object derived from astryx CSS tokens at runtime, re-derived on mode change.
- **Font:** Vazirmatn variable woff2 self-hosted from `vazirmatn` package.
- **Test harness:** **Vitest + @testing-library/react (jsdom)** for unit/component; **Playwright (`@playwright/test`)** for e2e/journey — this is the walking-skeleton harness and the name every gate builds on.

`SPIKE: is @astryxdesign/core actually RTL-correct under dir="rtl"?` Candidates: (a) yes — StyleX logical properties hold, proceed; (b) no — per-component patches via `swizzle`, feasibility re-check. Leading: (a), design assumes it. Measurement: walking-skeleton task renders AppShell + SideNav + Table + a dialog at `dir="rtl"`, 1280–1920 px, visual + Playwright screenshot check for mirrored layout and no horizontal overflow. Decides in Task 0/1.

`SPIKE: buy or build the Jalali picker UI?` Candidates: (a) `react-day-picker` @ 10.0.1 + `@daypicker/persian` @ 10.0.1 — maintained, ARIA-grid calendar with keyboard nav, Jalali via bundled `date-fns-jalali`, className-driven styling (astryx tokens via `classNames`/custom components, AGENTS.md-compliant); (b) hand-rolled on astryx primitives. Leading: (a) — buy is default and WCAG AA calendar interaction (roving focus, grid semantics, RTL arrow keys) is high-risk to hand-build. Measurement: spike renders (a) with astryx tokens, Vazirmatn, Persian digits, dark mode, Esfand 29/30, and passes keyboard-only date selection in Playwright. If (a) fails styling/RTL, path (b) activates and must first write the picker's keyboard/ARIA contract (grid role, arrow-key map in RTL, PageUp/Down months, Enter select, Esc close, focus trap) + Playwright coverage before implementation. Winner enters the dependency plan (or hand-rolled list) via plan patch.

## 2. Dependency plan (approved 2026-07-29)

Compatibility basis: npm peer-dependency matrices verified 2026-07-29; astryx peers `react >=19`, `@stylexjs/stylex ^0.19.0`; plugin-react 6 peers vite ^8; vitest 4 supports vite ^8; router 8 peers react >=19.2.7. Task 0 installs exactly these, frozen lockfile (Yarn).

| Capability | Package @ exact version | Replaces |
|---|---|---|
| UI component system | `@astryxdesign/core` @ 0.1.9 (+ `@astryxdesign/theme-neutral` @ 0.1.9, `@astryxdesign/cli` @ 0.1.9 dev) | all hand-rolled UI/layout/CSS |
| StyleX runtime (astryx peer) | `@stylexjs/stylex` @ 0.19.0 | — |
| Framework | `react` @ 19.2.8, `react-dom` @ 19.2.8 | — |
| Build tool | `vite` @ 8.1.5, `@vitejs/plugin-react` @ 6.0.4 (dev) | webpack-era setups |
| Language | `typescript` @ 5.9.3 (dev) | — (7.0.2 rejected: weeks-old native-compiler major, tooling risk) |
| Routing | `react-router` @ 8.3.0 | hand-rolled routing |
| Client state + persistence | `zustand` @ 5.0.14 | redux/context boilerplate |
| Jalali calendar math/format | `date-fns-jalali` @ 4.4.0-0 | hand-rolled Jalali arithmetic (leap years, Esfand) |
| Charts | `echarts` @ 6.1.0 | hand-rolled canvas/SVG charts |
| Persian font | `vazirmatn` @ 33.0.3 | CDN font (self-host for offline/perf) |
| Unit/component tests | `vitest` @ 4.1.10, `@testing-library/react` @ 16.3.2, `@testing-library/dom` @ 10.x (peer), `jsdom` (dev) | jest stack |
| e2e journey tests | `@playwright/test` @ 1.62.0 (dev) | cypress |
| Jalali picker UI *(spike-gated — see SPIKE in §1)* | `react-day-picker` @ 10.0.1 + `@daypicker/persian` @ 10.0.1 | hand-rolled accessible calendar interaction |

Hand-rolled (with reason):
- `<Chart>` ECharts React wrapper — needs token-theming/lazy control no maintained adapter gives (`echarts-for-react` effectively unmaintained); **not trivial** — bound by the lifecycle contract in §5a.
- Jalali picker UI **only if** the buy spike fails (see SPIKE); then bound by an explicit keyboard/ARIA contract first.
- `storage` adapter (persistence contract §4a), `digits.ts`, `bidi.ts`, `fa.json` catalog — trivial/domain.

No package enters code that isn't in this table (Phase 5 hard stop).

## 3. Module map

```
src/
  main.tsx            entry: astryx css imports, dir=rtl/lang=fa, router mount
  app/router.tsx      routes + guards + lazy boundaries + error boundary (S10)
  app/shell/          AppShell + SideNav + header (mode toggle, logout) — S4–S8 frame
  features/auth/      S1 S2 S3 pages, authStore
  features/overview/  S4 page, stat cards, chart configs
  features/users/     S5 table, S6 form + Jalali picker, S7 dialog, usersStore, fixtures
  features/settings/  S8 page
  components/chart/   lazy <Chart> wrapper + astryx-token ECharts theme
  components/jalali-picker/
  lib/date.ts digits.ts storage.ts bidi.ts(Latin-in-RTL isolation helper)
  locale/fa.json      astryx Persian catalog (we author)
  pages/errors/       S9 404, S10 500 fallback
```

Boundaries: features never import each other; shared code only via `lib/` and `components/`. Components never touch localStorage directly — stores only.

## 4. Data model (localStorage schema)

Keys, all values JSON, digits stored Latin, dates stored as ISO Gregorian (render-time Jalali conversion — single source of truth, no calendar drift):

```ts
// key: astryx-dash:v      number — storage schema version, currently 1
// key: astryx-dash:auth   { token: string; profile: { displayName: string; email: string } } | null
//                         — single owner of profile identity; S8 settings edits THIS (no settings key/store)
// key: astryx-dash:theme  { mode: 'light' | 'dark' }
// key: astryx-dash:users  User[]
type User = {
  id: string;            // crypto.randomUUID(), store-generated
  firstName: string;
  lastName: string;
  email: string;         // Latin, bidi-isolated at render
  role: 'admin' | 'editor' | 'viewer';     // default 'viewer'
  status: 'active' | 'inactive';           // default 'active'
  birthDate: string;     // ISO yyyy-MM-dd (Gregorian storage, Jalali display)
  createdAt: string;     // ISO datetime, store-generated
}
// Write model — what S6 submits; store fills id/createdAt/defaults:
type UserInput = {
  firstName: string;     // required, non-empty after trim
  lastName: string;      // required, non-empty after trim
  email: string;         // required, shape check, unique, digits normalized Latin
  role?: User['role'];
  status?: User['status'];
  birthDate: JalaliDate; // picker value; must be a real Jalali date (Esfand 29/30 honored),
                         // not in the future; converted via date-fns-jalali to ISO at the store boundary
}
```

**Seeding (governing rule, F2):** fixtures seed whenever the `users` key is *absent* — first run, after storage clear, or after corruption reset. The persisted empty array `[]` (user deleted every row) is a valid state and is never re-seeded. UX consequence: S5's empty state is reached by deleting all users or by zero-result search, not by clearing localStorage.

### 4a. Persistence contract (versioned decode + failover)

- **Versioning:** `astryx-dash:v` written on first boot. Version < current → run migration (none yet; table starts here); version missing with other keys present, or migration impossible → treat all keys as corrupt.
- **Decoders:** every key has a decoder validating JSON parse + shape + enum membership + date validity at hydration. Users array: invalid *records* are dropped individually; invalid *value* (not an array / parse failure) → key reset.
- **Corruption recovery:** a failed decode never throws into boot. The key resets to its default (`users` absent → reseeds per rule above; `auth` → null → login; `theme` → light) and sets `storage.recovered` → one-time Persian warning banner ("داده‌های ذخیره‌شده بازنشانی شد").
- **S10 escape hatch:** the 500 page offers, besides reload, "پاک‌کردن داده‌های ذخیره‌شده و شروع دوباره" — clears all `astryx-dash:*` keys then reloads, so a corrupt-state crash loop is always recoverable.
- **Failover (F5):** stores hold canonical state in memory at all times; localStorage is write-through only. The *first* failed write (quota, unavailable, security error) switches the whole session to memory-only — all subsequent writes across all stores skip persistence. Warn once per page lifetime via shell banner, wording includes that a reload will lose changes. Hydrated data is unaffected (already in memory). `localStorage` absent at boot → same memory-only mode from the start.

## 5. Contract surface (store APIs — no server)

Stores are the app's API; components call only these:

- `authStore`: `login(credentials) → void` (always succeeds, writes session; profile seeded from login email) · `logout()` · `session` (hydrated on boot — serves "reload → still logged in") · `updateProfile(input) → Result` — **sole owner of `displayName`/`email`**; S8 settings and the shell header both read/write here (F3: no separate settings store).
- `themeStore`: `mode` · `toggle()` (writes key, flips astryx theme class — serves "reload → dark persisted").
- `usersStore`: `users` (hydrated on boot) · `create(input: UserInput) → Result<User, FieldErrors>` · `update(id, input: UserInput) → Result` · `remove(id)` · pure selectors `query({search, sort, filter, page})` — search normalizes digits + Persian text. Validation per §4 `UserInput`: required fields, email shape + uniqueness, real non-future Jalali birth date; defaults applied on create; `id`/`createdAt` store-generated.

Errors: `Result` with Persian `FieldErrors` map — forms render inline; no exceptions across store boundary. Storage failure/corruption behavior: §4a.

### 5a. `<Chart>` lifecycle contract (F7)

The wrapper owns the full ECharts lifecycle; chart-using screens pass only an option-builder and data:

- **Load:** dynamic `import('echarts')` on first mount; while pending → skeleton (UX S4); import rejection → inline Persian error with retry button, never a crash to S10.
- **Init/dispose:** `echarts.init` on mount (renderer canvas, `useDirtyRect`), `dispose()` on unmount — no leaked instances.
- **Resize:** `ResizeObserver` on container → `chart.resize()`.
- **Data updates:** `setOption(option, { notMerge: true })` on prop change.
- **Theme:** theme object derived from astryx CSS custom properties at runtime; on `themeStore.mode` change, dispose + re-init with re-derived theme (serves "toggle → charts re-theme instantly" and "re-brand without component edits" — token read happens at derive time).
- **Zero data:** empty series → astryx empty-state overlay instead of blank canvas.
- **RTL/digits:** wrapper injects Jalali axis formatter + Persian-digit label formatter so screens never hand-format.

Vitest covers: dispose-on-unmount, re-init on theme change, import-failure error state, zero-data overlay.

## 6. Kernel-journey traceability

| Journey step | Serving contract |
|---|---|
| Open app → S1 login | router guard reads `authStore.session` (null) |
| Submit credentials → S4 | `authStore.login()` |
| S4 stats/charts, Jalali/Persian digits | `usersStore.users` + `lib/date.format*` + `lib/digits.toPersianDigits` via `<Chart>` |
| Navigate to S5 table | `usersStore.query()` |
| Create user w/ Jalali birth date | `<JalaliPicker>` → `usersStore.create()` |
| New user in table | `usersStore.query()` re-select |
| Toggle dark mode | `themeStore.toggle()` + `<Chart>` theme re-derive |
| Reload → session/mode/user persist | boot hydration of all three stores from `storage.ts` |
| Logout → S1 | `authStore.logout()` + guard redirect |

No external systems, no server, no third-party protocol surface — the external-integration ceremony (verified fakes, canary, production-composition proof) does not apply. Threat model: not required — no real auth, no server, no cross-user data; all input is the local user's own, validated at form boundary. Flag stands: if real API/auth lands (backlog 3), lite profile no longer qualifies.

## 7. Error handling & config

- Route-level error boundary → S10; unknown route → S9.
- Store ops never throw; `Result` for validation, silent-degrade + banner for storage.
- Config: none at runtime. Theming = build-time via `astryx theme` (brand accent) + tokens; documented in README for fork-and-rebrand (kernel promise 5). Never override `--color-*` in `:root`.

## Decision log

- 2026-07-29 — TypeScript 5.9.3 over 7.0.2 — new native-compiler major too fresh; tooling risk outweighs speed.
- 2026-07-29 — store dates as ISO Gregorian, render Jalali — one canonical form, `date-fns-jalali` converts at edges; avoids double-calendar drift.
- 2026-07-29 — hand-rolled Jalali picker UI on astryx primitives — core domain gap; no astryx Jalali picker exists.
- 2026-07-29 — [REVIEW_1 F6] superseded previous line: picker is now a buy-vs-build SPIKE, leading candidate react-day-picker + @daypicker/persian — hand-building WCAG AA calendar interaction is high-risk; buy is default.
- 2026-07-29 — [REVIEW_1 F1/F5] versioned persistence contract (§4a): per-key decoders, corruption reset + reseed, session-wide memory-only failover, S10 clear-state escape — reload-persistence criteria need defined failure behavior, not optimism.
- 2026-07-29 — [REVIEW_1 F2] seed when `users` key absent; persisted `[]` never reseeds — resolves seed-vs-empty-state contradiction; empty state = user deleted all rows.
- 2026-07-29 — [REVIEW_1 F3] dropped settingsStore; authStore sole profile owner — three-store commitment holds, no dual ownership of displayName.
- 2026-07-29 — [REVIEW_1 F4] explicit `UserInput` write model with defaults + Jalali date validation at store boundary — persisted `User` invariants must be enforceable, not implied.
- 2026-07-29 — [REVIEW_1 F7] `<Chart>` bound by lifecycle contract §5a; "trivial" size claim removed — init/dispose/resize/theme/error behavior is testable surface, not incidental.
- 2026-07-29 — [Task 3 RTL spike] candidate (a) confirmed: Astryx `AppShell`, `SideNav`, `Table`, and `Dialog` mirrored correctly under `dir="rtl"` at 1280px and 1920px with no page-level horizontal overflow. Proceed with the native Astryx shell; no swizzles or feasibility re-check required.
