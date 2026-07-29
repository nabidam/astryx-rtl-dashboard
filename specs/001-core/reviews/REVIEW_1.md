# REVIEW 1 — Architecture vs UX/SPEC

- **Review type:** planning-contract review
- **Reviewed artifacts:** `ARCHITECTURE.md`, `UX.md`, `specs/001-core/SPEC.md`
- **Reviewed commit range:** N/A — reviewed planning artifacts are not committed
- **Focus:** failure handling, data model, over-engineering, build-vs-buy
- **Status:** resolved 2026-07-29 — all 7 findings patched into ARCHITECTURE.md (§1 SPIKEs, §2, §4, §4a, §5, §5a, Decision log), UX.md (S5/S10/global states), SPEC.md (edge-case line). F6/F7 resolved as spike + lifecycle contract per one-line fixes.

## Findings

### F1 — Persisted data has no validation, versioning, or corruption recovery

- **Severity:** high
- **Category:** failure handling, data model
- **Confirmation:** confirmed contract gap

**Architecture side**

> `ARCHITECTURE.md:67` — “Keys, all values JSON, digits stored Latin, dates stored as ISO Gregorian...”
>
> `ARCHITECTURE.md:92` — “authStore ... session (hydrated on boot...)”
>
> `ARCHITECTURE.md:94` — “usersStore: users (hydrated on boot)...”
>
> `ARCHITECTURE.md:118` — “Store ops never throw...”

**UX/SPEC side**

> `UX.md:18` — “S10 | 500 | Render-error boundary fallback ... Static; reload action”
>
> `SPEC.md:70` — “Users CRUD ... all survive reload.”
>
> `SPEC.md:72-74` — theme, session, and settings changes persist across reload.

The architecture does not define JSON parse failure, stale schema handling, runtime validation, migration, or quarantine/reset behavior. A malformed or old localStorage value can fail boot hydration and make S10’s reload action repeat the same failure indefinitely.

**One-line fix:** Define versioned per-key decoders and migration/reset behavior, surface a recoverable Persian warning, and make S10 capable of clearing invalid persisted state.

---

### F2 — Fixture seeding contradicts the specified empty state after storage clear

- **Severity:** medium
- **Category:** data model, contract conflict
- **Confirmation:** confirmed by both sides; product decision required

**Architecture side**

> `ARCHITECTURE.md:86` — “Seed fixtures load once when `users` key absent...”

**UX/SPEC side**

> `UX.md:13` — “Fresh/empty store → empty state...”
>
> `UX.md:39` — “S5 table with seeded Persian fixture data...”
>
> `SPEC.md:42` — “Empty states: fresh table after localStorage clear...”

After localStorage is cleared, the users key is absent, so the architecture requires fixtures to load rather than the empty state required by SPEC. The same state cannot satisfy both contracts.

**One-line fix:** Choose the governing reset behavior; recommended resolution is to seed on first run/reset and redefine the empty-state path as deleting all users.

---

### F3 — Settings create a contradictory fourth store and duplicate profile ownership

- **Severity:** medium
- **Category:** data model, over-engineering
- **Confirmation:** confirmed architecture contradiction

**Architecture side**

> `ARCHITECTURE.md:10` — “Zustand 5 — three stores: `authStore`, `themeStore`, `usersStore`.”
>
> `ARCHITECTURE.md:70` — auth persists `user: { name: string; email: string }`.
>
> `ARCHITECTURE.md:83` — settings persists `{ displayName: string }`.
>
> `ARCHITECTURE.md:95` — defines a separate `settingsStore`.

**UX/SPEC side**

> `UX.md:16` — settings includes profile name and appearance, with changes persisted immediately.
>
> `SPEC.md:49` — state is “Zustand (theme, auth, users store).”
>
> `SPEC.md:74` — settings changes persist.

The architecture simultaneously commits to three stores and defines four. It also gives both the auth session and settings data ownership of the displayed profile name without defining synchronization or which value the shell renders.

**One-line fix:** Establish one canonical profile owner; for the lite profile, fold `displayName` into `authStore` and keep the three-store commitment.

---

### F4 — The User write model omits invariants required by its persisted type

- **Severity:** medium
- **Category:** data model, failure handling
- **Confirmation:** confirmed contract gap

**Architecture side**

> `ARCHITECTURE.md:73-82` — persisted `User` requires `role`, `status`, `birthDate`, and `createdAt`.
>
> `ARCHITECTURE.md:86` — store constraints cover only unique email, required first/last/email, and email shape.

**UX/SPEC side**

> `UX.md:14` — create/edit uses a Jalali birth-date picker and per-field validation.
>
> `UX.md:40` — the picker must handle correct Esfand month behavior.
>
> `SPEC.md:69` — the picker must produce and edit Jalali dates including Esfand edge months.

The architecture does not define `UserInput`, defaults for role/status, valid Gregorian ISO conversion, invalid/future birth-date behavior, or validation of persisted enum values. Consequently, the store contract can produce or hydrate values that do not satisfy `User`.

**One-line fix:** Define separate input and persisted schemas with explicit defaults and date/enum validation at create, update, and hydration boundaries.

---

### F5 — In-memory storage failover semantics are incomplete

- **Severity:** medium
- **Category:** failure handling
- **Confirmation:** confirmed contract gap

**Architecture side**

> `ARCHITECTURE.md:10` — each store uses “localStorage with in-memory fallback + one-time warning flag.”
>
> `ARCHITECTURE.md:97` — “Storage failures degrade to in-memory ... shell banner.”
>
> `ARCHITECTURE.md:118` — “silent-degrade + banner for storage.”

**UX/SPEC side**

> `UX.md:20` — localStorage unavailable/full must warn once while the app continues in memory.
>
> `SPEC.md:43` — localStorage unavailable/full must fall back to memory and warn once.

The architecture does not define whether successfully hydrated values are copied into memory, whether all stores fail over together, how a quota error on a later write affects current state, or whether “once” means per operation, page lifetime, or installation.

**One-line fix:** Specify session-wide atomic failover: retain hydrated/current values in memory, switch all writes after the first storage failure, warn once per page lifetime, and disclose that another reload loses in-memory changes.

---

### F6 — Hand-building the Jalali picker lacks an accessibility build-vs-buy gate

- **Severity:** medium
- **Category:** build-vs-buy
- **Confirmation:** confirmed missing decision criteria

**Architecture side**

> `ARCHITECTURE.md:40` — “Jalali date picker UI ... UI composed from astryx primitives.”
>
> `ARCHITECTURE.md:125` — the decision log commits to a hand-rolled picker because Astryx has no Jalali picker.

**UX/SPEC side**

> `UX.md:40` — the kernel journey depends on the picker.
>
> `SPEC.md:50` — WCAG AA and keyboard navigation through the picker are required.
>
> `SPEC.md:69` — correct Jalali editing and Esfand behavior are acceptance criteria.

The absence of an Astryx component does not establish that a complete custom calendar interaction is the lowest-risk choice. The architecture does not evaluate accessible headless calendar behavior, nor does it specify focus management, grid semantics, keyboard commands, RTL behavior, or corresponding tests.

**One-line fix:** Add an early accessible-calendar build-vs-buy spike; if no compatible primitive qualifies, define the picker’s keyboard/ARIA contract and Playwright coverage before implementation.

---

### F7 — The custom ECharts wrapper is called trivial without a lifecycle contract

- **Severity:** low
- **Category:** build-vs-buy, under-estimated custom work
- **Confirmation:** confirmed architecture inconsistency

**Architecture side**

> `ARCHITECTURE.md:13` — the wrapper must lazy-load ECharts, derive a token theme, and re-derive it on mode change.
>
> `ARCHITECTURE.md:39` — the wrapper is described as “trivial (< ~30 lines).”

**UX/SPEC side**

> `UX.md:12` — charts need loading skeletons and zero-data behavior.
>
> `UX.md:42` — charts must re-theme instantly.
>
> `SPEC.md:72` — chart theming must persist with dark/light mode.
>
> `SPEC.md:75` — brand re-theming must update charts without component-code changes.

The size assertion is not supported by a contract covering initialization, cleanup, resize, option updates, lazy-import rejection, theme recreation, and zero-data behavior.

**One-line fix:** Evaluate an existing React adapter against explicit requirements or remove the size claim and define lifecycle/error/theme tests for the custom wrapper.

## Build-vs-buy disposition

| Capability | Disposition |
|---|---|
| Astryx UI, React, Zustand, Jalali date math, ECharts, test tooling | Buy/use approved dependencies |
| Jalali calendar interaction | Evaluate an accessible headless primitive before committing to build |
| Storage fallback | Keep a thin custom adapter, but specify decoding and failover semantics |
| Digits, bidi isolation, Persian Astryx catalog | Build; small domain-specific utilities |
| ECharts React integration | Build only with an explicit lifecycle contract; otherwise buy an adapter |
| Standalone settings store | Do not build; consolidate profile ownership |

## Resolution order

1. Resolve F2 and F3 because they require product/data ownership decisions.
2. Patch the persistence contract for F1 and F5.
3. Define the `UserInput` and hydration invariants for F4.
4. Run the build-vs-buy spikes for F6 and F7 before implementation planning.

No implementation changes should begin against the affected contracts until these findings are resolved in `ARCHITECTURE.md`, `UX.md`, and `SPEC.md`.
