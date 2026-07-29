# UX — Astryx RTL Admin Dashboard (lite)

Living doc. All screens RTL, Persian, Vazirmatn, Persian digits. S4–S8 render inside the app shell (AppShell + SideNav); S1–S3 and S9–S10 are bare full-page layouts.

## Screen inventory

| id | Screen | Purpose | Entry points | Empty / error states |
|----|--------|---------|--------------|----------------------|
| S1 | Login | Fake auth entry; any credentials accepted | App root when logged out; logout; links from S2/S3 | Validation: empty fields → inline Persian messages; no server errors (fake auth) |
| S2 | Register | UI-only registration form | Link on S1 | Inline Persian validation per field; success routes to S1 |
| S3 | Forgot password | UI-only reset form | Link on S1 | Empty email → inline message; submit shows success note, link back to S1 |
| S4 | Overview dashboard | Stat cards + ECharts charts (Jalali axes, Persian digits) | Default route after login; SideNav | Charts loading → skeleton placeholders (lazy ECharts); zero data → cards show ۰ with muted note |
| S5 | Users table | List/search/sort/filter/paginate users; row actions edit/delete | SideNav; after save from S6 | Empty state (all users deleted) → "افزودن کاربر" CTA; zero-result search → "نتیجه‌ای یافت نشد" + clear-search action. Note: fresh install / cleared storage re-seeds fixtures — empty state is reachable only by deleting rows |
| S6 | User form (create/edit) | Create or edit a user; Jalali birth-date picker | "افزودن کاربر" button on S5; row edit action | Per-field Persian validation (required, email shape); edit of missing id → redirect to S5 |
| S7 | Delete confirm dialog | Confirm destructive delete | Row delete action on S5 | Cancel closes with no change; confirm removes row, dialog closes |
| S8 | Settings | Profile (name) + appearance (theme mode, brand note) | SideNav | Inline validation on name; changes persist immediately |
| S9 | 404 | Unknown route | Any bad URL | Static; link back to S4 |
| S10 | 500 | Render-error boundary fallback | Uncaught render error | Two actions: reload, and "پاک‌کردن داده‌های ذخیره‌شده و شروع دوباره" (clears saved data then reloads — escape from corrupt-state crash loops) |

Global states (once per page lifetime, shell banner):
- Storage unavailable/full → warning: app continues in memory, wording states a reload will lose changes.
- Corrupt saved data recovered at boot → info banner: "داده‌های ذخیره‌شده بازنشانی شد" (affected data reset to defaults).

## Navigation map

```
S1 login ⇄ S2 register
S1 ⇄ S3 forgot-password
S1 --(submit)--> S4 overview
AppShell/SideNav: S4 ⇄ S5 ⇄ S8   (+ dark-mode toggle, logout → S1)
S5 → S6 user form → back to S5
S5 → S7 delete dialog (modal over S5)
unknown route → S9 · render crash → S10
```

## Kernel flow (step by step)

1. User opens app → sees S1: RTL Persian login, Vazirmatn, fields قابل focus.
2. Enters any credentials, submits → system stores fake session, routes to S4.
3. S4 shows stat cards + charts; axis labels Jalali, digits Persian; eye lands on top-start stat card row.
4. User clicks "کاربران" in SideNav → S5 table with seeded Persian fixture data; Latin emails bidi-isolated.
5. Clicks "افزودن کاربر" → S6 form; picks birth date from Jalali picker (Esfand months correct).
6. Submits → system validates in Persian, saves to store, returns to S5; new row visible (search finds it).
7. Toggles dark mode in shell header → whole app incl. charts re-themes instantly.
8. Reloads browser → still logged in, dark mode kept, created user still in table.

## Secondary flows

- **Edit user:** S5 row edit → S6 prefilled → save → S5 row updated.
- **Delete user:** S5 row delete → S7 confirm → row gone; survives reload.
- **Logout/login:** shell logout → S1; session cleared; login again → S4.

## Operator surfaces

- **astryx CLI** (`npx astryx ...`) — dev-time discovery/theming tool per AGENTS.md; not app UI, no screens.
