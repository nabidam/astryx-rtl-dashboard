# Astryx RTL Dashboard

A Persian-first, RTL admin dashboard scaffold built with Vite, React, TypeScript, and Astryx.

## Run locally

```bash
yarn install --frozen-lockfile
yarn dev
```

Open the URL printed by Vite. The scaffold renders a Persian RTL walking skeleton and loads Vazirmatn locally from the `vazirmatn` package.

## Verify

```bash
yarn verify
```

Verification runs strict TypeScript checking, ESLint, Prettier, and Vitest. The browser journey harness is available with `yarn test:e2e`. The optional `yarn verify:security` command runs the Yarn dependency audit and repository secret scan.

Astryx components and themes are discovered with `npx astryx build "<idea>"`, `npx astryx component <Name>`, and `npx astryx docs <topic>`.
