# CONVENTIONS — Astryx RTL Admin Dashboard (lite)

Living doc. Stack, module map, store contracts: ARCHITECTURE.md. Visual rules: DESIGN.md.

## Naming & folders

- Files: `kebab-case.ts(x)`; components `PascalCase` exported from kebab files is forbidden — component file = `PascalCase.tsx`. Hooks `useX.ts`. Stores `xStore.ts` in their feature.
- Structure per ARCHITECTURE §3: `features/*` never import each other; shared code only via `lib/` and `components/`. Components never touch `localStorage` — stores only; no direct `Date` formatting — `lib/date.ts` only; digit conversion — `lib/digits.ts` only.
- UI strings: Persian, inline in components; astryx-internal strings via `locale/fa.json`. Latin-in-RTL wrapped by `lib/bidi.ts`.

## Error handling

- Store mutations return `Result<T, FieldErrors>` (Persian messages); never throw across the store boundary. Storage failure/corruption = silent degrade + banner (ARCHITECTURE §4a). Render crashes → route error boundary (S10). No `try/catch` in components.

## Lint-over-prose (Task 0 wires these; prose here is only what lint can't see)

ESLint flat config + `typescript-eslint` strict: `no-restricted-imports` (cross-feature imports; `date-fns-jalali` outside `lib/date.ts`; `echarts` outside `components/chart/`), `no-restricted-globals`/`no-restricted-properties` (`localStorage` outside `lib/storage.ts`), `no-restricted-syntax` (raw hex/px in `style` props), `react-hooks` rules. Prettier defaults. `any` banned by tsconfig strict + lint.

## Package-before-custom

Hand-implementing a capability ARCHITECTURE §2 assigns to a package is a review finding. New packages only via ARCHITECTURE §2 table update.

## Test strategy

| Layer | Verifies | Tools |
|---|---|---|
| `[unit]` | `lib/` (date, digits, bidi, storage decoders), store logic (validation, seeding, failover, query selectors) | Vitest |
| `[integration]` | Component behavior: form validation display, table interactions, `<Chart>` lifecycle (§5a), dialog flows | Vitest + @testing-library/react (jsdom) |
| `[e2e@gate-N]` | Kernel journey + reload persistence, RTL/keyboard checks, dark-mode re-theme — in the running app | Playwright (`@playwright/test`) |

- Test files: `*.test.ts(x)` beside source; e2e in `e2e/*.spec.ts`. Style: arrange-act-assert, one behavior per test, Persian fixture data from `features/users/fixtures`.
- Verify command: `yarn verify` = `tsc --noEmit && eslint . && vitest run`. E2e: `yarn test:e2e` (Playwright starts `yarn dev` server). Both must pass before any commit lands.

## Cycle 001 Task 0 waiver

Per the human implementation instruction for this lite cycle, Task 0 is not gated on an automated axe-equivalent accessibility scan, dependency audit, or secret scan. `yarn verify` remains the required code-quality and Vitest contract check; `yarn verify:security` is retained as an optional follow-up.

## Commits

Conventional Commits: `feat(users): add jalali birth-date validation` — imperative, lowercase, ≤72 chars. Scopes: `shell|auth|overview|users|settings|chart|picker|lib|locale|infra`. No co-author trailers.
