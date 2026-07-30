# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are developers and product teams building Persian-language admin products. They fork this template when they need a credible RTL foundation instead of assembling its core conventions and interactions from scratch.

## Product Purpose

Astryx RTL Admin Dashboard is a production-quality, Persian-first admin-dashboard template. It gives teams a working foundation for authentication flows, dashboard reporting, user management, settings, Persian RTL behavior, Jalali dates, and persistent demo state, so they can re-theme and extend it for their own products.

## Positioning

The template combines an Astryx-based design-system implementation with Persian-native operational details: RTL layout, Vazirmatn typography, Persian digit rendering, Jalali date input and display, and token-derived light/dark chart theming. Those details are built into the working product paths rather than left as generic localization guidance.

## Operating Context

Teams run the Vite React single-page application locally, explore the fake-authenticated dashboard flow, and fork it to form the administrative surface of another product. The supplied user records and session are browser-local mock data, persisted through localStorage for the demonstration journey.

## Capabilities and Constraints

- Persian-first RTL application shell, routes, and locale catalog.
- Fake authentication UI: any credentials create a local session; there is no real backend, account system, or authorization boundary.
- User CRUD with search, sort, filters, pagination, inline Persian validation, Jalali birth-date selection, and local persistence.
- Overview statistics and lazy-loaded ECharts visualizations, plus persisted light/dark appearance and profile settings.
- Dates display in the Jalali calendar; user-facing numeric content uses Persian digits while storage normalizes to Latin digits.
- Built as a Vite, React, TypeScript SPA with Astryx components and tokens, Zustand state, and Yarn tooling.
- Rebranding is performed through the Astryx theme/token workflow, without per-component color overrides.
- Scope deliberately excludes a real API, real authentication/authorization, non-Persian localization, mobile-dedicated layouts, and runtime end-user dashboard customization.

## Evidence on Hand

- Product requirements and acceptance criteria: `specs/001-core/SPEC.md`.
- Current architecture and implementation contracts: `ARCHITECTURE.md`.
- Existing runnable implementation: `src/`.
- Local verification and re-theming guidance: `README.md`.
- The project contains mock fixtures only; it has no approved real customer testimonials, case studies, benchmarks, or production-service claims to reuse or invent.

## Product Principles

1. Persian-native behavior is a product requirement, not a translation layer added afterward.
2. Give forking teams a complete operational foundation while keeping the path to rebranding straightforward.
3. Keep demo data and authentication explicitly local and replaceable; never imply production security or server-backed behavior.
4. Preserve strict, accessible interaction quality across RTL navigation, forms, tables, dialogs, and calendar input.
5. Use the design system and semantic theme tokens as the durable customization boundary.

## Accessibility & Inclusion

WCAG AA is the required baseline. Keyboard navigation through the application shell, table, dialogs, and Jalali date picker is part of the documented acceptance criteria. RTL and bidirectional text behavior, including isolated Latin email addresses within Persian UI, must remain reliable.
