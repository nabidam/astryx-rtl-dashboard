---
status: gate-passed
profile: lite
---

# SPEC — Astryx RTL Admin Dashboard (Persian-first template)

## 1. Core promise

A production-quality, RTL-first Persian admin dashboard template built on the astryx design system, that developers fork and re-theme for their own products.

## 2. Kernel

1. **RTL Persian app shell** — `dir="rtl"` document, AppShell + SideNav, Persian typography (Vazirmatn), light/dark mode, Persian astryx locale catalog (`fa.json` — does not ship with astryx, we author it).
2. **Jalali date system** — all dates render Jalali (Shamsi); Jalali date picker for input. No Gregorian leaks anywhere in the UI.
3. **Users CRUD** — data table (search, sort, filter, paginate) + create/edit form with Persian validation messages + delete with confirm. Backed by localStorage-persisted mock data layer.
4. **Overview dashboard** — stat cards + ECharts charts, themed with astryx tokens, RTL-configured, Jalali axis labels, Persian digits.
5. **Developer theming** — customization happens through astryx theme/tokens (`astryx theme`), documented so a fork can rebrand without touching component code.

### Kernel journey

Open the app → login page in Persian, RTL → enter any credentials → land on overview: stat cards and charts, Jalali dates, Persian digits → navigate to users table → create a user, picking a Jalali birth date from the picker → new user appears in the table → toggle dark mode → reload the app → still logged in, dark mode persisted, created user still in the table.

## 3. v1 / Backlog

**v1** (all user-stated): kernel above, plus auth pages (login / register / forgot-password — UI only, fake auth), settings page (profile + appearance), error pages (404 / 500), mock data fixtures with realistic Persian names/content.

**Backlog (ranked)**
1. fa/en bilingual toggle with LTR flip
2. More CRUD modules (orders, products)
3. Real API adapter layer (swap mock for fetch)
4. Notifications center / activity feed
5. Role-based menu visibility
6. Widget rearrangement (runtime customization)

## 4. Edge cases

- Long Persian strings truncating in SideNav/table cells (ellipsis direction in RTL).
- Mixed-direction content: Latin emails/usernames inside RTL cells (bidi isolation).
- Persian vs Latin digits: digits are Persian (۰–۹) in UI text/dates; form inputs accept both, normalize to Latin for storage.
- Jalali leap years / month lengths in the picker (Esfand 29/30).
- Empty states: table after user deletes all rows (cleared/absent storage re-seeds fixtures — REVIEW_1 F2), zero-result search.
- localStorage unavailable/full → fall back to in-memory, warn once.

## 5. Non-functional + tech constraints

- Stack: Vite + React SPA, TypeScript strict, no `any`. Yarn.
- Components: `@astryxdesign/core` only — no raw div layout, tokens for every value, per AGENTS.md rules. Charts are the sole exception (ECharts canvas).
- State: Zustand (theme, auth, users store). No server.
- A11y: WCAG AA; keyboard nav through shell, table, picker.
- Performance: initial route interactive < 2s on dev hardware; ECharts lazy-loaded.

## 6. Suggested tech stack

Vite + React 19 + TS, `@astryxdesign/core` 0.1.9, Zustand, ECharts (lazy), `date-fns-jalali` for Jalali math/formatting, Vazirmatn variable font (self-hosted). Fake auth + localStorage persistence (assumption — see below).

## 7. Design direction

Personality: precise, calm, trustworthy. References: Linear (density/craft), Vercel dashboard (restraint), Digikala seller panel (Persian admin conventions). Desktop-first density, comfortable spacing per astryx defaults. WCAG AA floor. **Design system: astryx (`theme-neutral` base). Deltas: Vazirmatn typography, Persian digit rendering, ECharts theme derived from astryx tokens.**

## 8. Out of scope

Backend/API, real authentication/authorization, i18n beyond Persian, mobile-dedicated layouts (responsive down to tablet only), runtime end-user customization, tests of astryx internals.

## 9. Acceptance criteria (lite profile)

- App boots with `dir="rtl"`, `lang="fa"`; no horizontal-flow bug in shell at 1280–1920 px widths.
- Every user-visible astryx string renders Persian via `fa.json` catalog (spot-check: table pagination, dialogs, empty states).
- Zero Gregorian dates visible anywhere; date picker produces/edits Jalali dates incl. Esfand edge months.
- Users CRUD: create → visible in table; edit → persisted; delete → confirm dialog → gone; all survive reload.
- Search/sort/paginate work with Persian text; Latin emails render bidi-isolated (no scrambled cells).
- Dark/light toggle persists across reload; charts re-theme with mode.
- Fake login with any credentials → session persists across reload; logout returns to login.
- 404 renders for unknown routes; settings changes (name, appearance) persist.
- Re-theme test: changing brand accent via `astryx theme` restyles shell, buttons, charts with no component-code edits.
- `yarn build` passes with TS strict, zero errors.

## Assumptions (explicit)

- Astryx components are RTL-correct under `dir="rtl"` (StyleX logical properties; hooks advertise RTL). **Must be verified by an early spike in the walking skeleton — if false, this spec's feasibility changes.**
- Auth is fake: any credentials accepted, session token in localStorage.
- Persistence is localStorage only; template consumers swap in a real API later (backlog item 3).
- Vazirmatn is the Persian font unless the user objects.
