# DESIGN — Astryx RTL Admin Dashboard (adoption map, lite)

Living doc. Pre-built design system: **astryx** (`@astryxdesign/core` 0.1.9 + `@astryxdesign/theme-neutral`). **Single source of truth for every visual value is the astryx token/theme files (`astryx.css`, `theme-neutral`) — this doc maps roles to token/component names and never restates a value.** Discover with `npx astryx docs tokens` / `npx astryx component <Name>`.

## Direction

Precise, calm, trustworthy. References: Linear (density/craft), Vercel dashboard (restraint), Digikala seller panel (Persian admin conventions). Deliberate visual signature: fully Persian surface — Vazirmatn everywhere, Persian digits (۰–۹) in every label, axis, and date; no Latin leaks except bidi-isolated emails.

## Semantic role → astryx token

| Role | Token |
|---|---|
| Page background | `--color-background-body` |
| Card / panel surface | `--color-background-card`, `--color-background-surface` |
| Popover / dialog surface | `--color-background-popover` |
| Primary / secondary / disabled text | `--color-text-primary` / `--color-text-secondary` / `--color-text-disabled` |
| Brand accent (links, primary buttons, active nav) | `--color-accent`, `--color-text-accent`, `--color-on-accent` |
| Validation error text/ring | `--color-error`, `--shadow-inset-error` |
| Success / warning states | `--color-success`, `--color-warning` (+ `-muted`, `on-` pairs) |
| Borders, table rules | `--color-border`, `--color-border-emphasized` |
| Skeleton / loading | `--color-skeleton` |
| Status colors (user active/inactive) | via `StatusDot` variants, not raw tokens |
| Spacing | `--spacing-1`…`--spacing-12` (4px grid) |
| Radii | `--radius-inner` / `--radius-element` / `--radius-container` |
| Elevation | `--shadow-low` / `--shadow-med` / `--shadow-high` |
| Motion | `--duration-fast` / `--duration-medium`, `--ease-standard` |
| Type scale | `--font-size-sm`…`--font-size-2xl`, weights `--font-weight-normal/medium` |

Contrast: theme-neutral token pairs are the system's responsibility (WCAG AA maintained upstream); we introduce no new color values, so no project-side ratio table exists. The re-brand accent chosen via `astryx theme` must keep AA against `--color-on-accent` — checked at the demo gate.

Dark mode: all color tokens are `light-dark()`-driven; `themeStore` flips the astryx `Theme` mode — no per-component dark styles ever.

## Component inventory (UX element → astryx component)

| UX element | Component |
|---|---|
| App frame (S4–S8) | `AppShell` |
| Sidebar nav | `SideNav`, `SideNavSection`, `SideNavItem`, `SideNavCollapseButton` |
| Header actions (mode toggle, logout) | `IconButton`, `DropdownMenu` + `DropdownMenuItem` |
| Auth page layout (S1–S3) | `Center` + `Card` |
| Forms (S1–S3, S6, S8) | `FormLayout`, `Field`, `FieldLabel`, `FieldStatus`, `TextInput`, `Button` |
| Stat cards (S4) | `Grid` + `Card` + `Text` |
| Chart loading (S4) | `Skeleton` |
| Users table (S5) | `Table`, `TableRow`, `TableHeaderCell`, `TableCell` |
| Search / filter (S5) | `TextInput`, `Selector` + `SelectorOption` |
| Pagination (S5) | `Pagination` |
| Role display (S5) | `Token`; user status → `StatusDot` |
| Row actions (S5) | `IconButton`, `MoreMenu` |
| Role/status inputs (S6) | `Selector` |
| Jalali picker container (S6) | `Popover` (calendar body: see gap list) |
| Delete confirm (S7) | `AlertDialog` |
| Settings groups (S8) | `Section`, `Card`, `SegmentedControl` (theme mode) |
| Error pages (S9/S10) | `Center` + `EmptyState` + `Button` |
| Global banners | `Banner` |
| Empty states (S4/S5) | `EmptyState` |
| Text / links everywhere | `Text`, `Link` |
| Theme + locale providers | `Theme`, `InternationalizationProvider` (loads our `locale/fa.json`) |
| Loading spinners | `Spinner` |

## Gap list (astryx can't serve — resolutions already approved in SPEC/ARCHITECTURE)

1. **Jalali calendar UI** — astryx `Calendar`/`DateInput` are Gregorian-only. Resolution: spike-gated `react-day-picker` + `@daypicker/persian`, styled with astryx tokens via `classNames` (ARCHITECTURE §1 spike, REVIEW_1 F6).
2. **Charts** — no astryx chart components. Resolution: ECharts behind `<Chart>` wrapper, theme derived from astryx tokens at runtime (ARCHITECTURE §5a); sole non-astryx render surface allowed.
3. **Persian locale catalog** — astryx ships no `fa.json`. Resolution: we author `locale/fa.json`, loaded through `InternationalizationProvider`.
4. **Vazirmatn typography** — `--font-family-body/heading` default to system stacks. Resolution: font swap through the astryx theming layer (`astryx theme` / theme config), self-hosted `vazirmatn` woff2; never a raw `:root` `--color-*` override (font-family tokens are the sanctioned delta per SPEC §7).
5. **Persian digits** — no system facility. Resolution: `lib/digits.ts` at render boundaries; `<Chart>` injects digit/Jalali formatters.

Any new gap found during implementation: stop, get user approval before inventing a substitute.

## Usage rules (hard)

- Components only — no raw `<div>`/`<span>` layout; layout via `AppShell`/`Layout`/`Stack`/`Grid`/`Section` (AGENTS.md).
- Tokens for every styled value; no raw hex/px/font values anywhere, charts included (theme derives from tokens).
- Dense data = `Table`/`List` rows edge-to-edge; `Card` only for dashboard widgets, auth panels, settings groups.
- `StatusDot`/`Token` for status; `Badge` only for counts.
- Re-brand path: `astryx theme` only; never override `--color-*` in `:root`.
- Focus visible + WCAG AA everywhere; keyboard path through shell, table, dialog, picker (Playwright-checked at gates).
- RTL: rely on astryx logical properties; any component that fails the RTL spike gets `swizzle`-patched, not wrapped in CSS hacks.
