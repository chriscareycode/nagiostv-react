# React 19 and React Router 8 Migration Plan

This runbook covers the coordinated platform upgrade needed to move NagiosTV
from React 18 and React Router 7 to the first React Router line that resolves
the RSC/action-mode advisory `GHSA-qwww-vcr4-c8h2`.

Do not begin the dependency upgrade until the development and CI runtimes use
Node 22.22.0 or newer.

## Current baseline

- Node before migration: 22.14.0
- Node used for migration validation: 24.18.0
- React and React DOM before migration: 18.3.1
- React Router DOM before migration: 7.18.1
- Vite: 8.0.16
- TypeScript: 5.9.3
- `@testing-library/react` before migration: 15.0.7
- Validation: 37 test files and 146 tests passing before this planning work

## Required target baseline

- Node: 22.22.0 or newer
- React and React DOM: 19.2.7 or newer
- React Router: 8.3.0 or newer
- `@types/react` and `@types/react-dom`: matching React 19 releases
- `@types/node`: matching Node 24 release
- `@testing-library/react`: 16.3.2 or newer
- Vite 8 can remain in place

React Router 8 removes the compatibility `react-router-dom` package. Runtime
imports must come from `react-router`.

## Compatibility audit

- [x] The application uses `createRoot`; it does not use legacy
  `ReactDOM.render`.
- [x] No use of `findDOMNode`, `hydrateRoot`, string refs,
  `unmountComponentAtNode`, `createFactory`, or `react-test-renderer` was found.
- [x] FontAwesome React, Allotment, Highcharts React, Jotai, Motion, and
  React Tooltip declare React 19 support or a sufficiently broad React peer
  range.
- [x] `@testing-library/react` 15 only declares React 18 support and must be
  upgraded with React.
- [x] Vite 8 satisfies React Router 8's Vite baseline.
- [x] The original Node 22.14 runtime did not satisfy React Router 8's
  Node 22.22 minimum; the migration used Node 24.18.

## Migration sequence

### 1. Establish the runtime baseline

- [x] Upgrade local development to Node 22.22.0 or newer.
- [x] Add an `engines.node` constraint to `package.json`.
- [x] Add or update the repository's chosen Node-version file.
- [x] Run the existing `npm run check` before changing dependencies.
- [ ] Verify CI and deployment environments use Node 24.18.0 or newer.

Keep this runtime change separate from the dependency migration when practical,
so failures can be attributed cleanly.

### 2. Upgrade React and test infrastructure

- [x] Upgrade `react` and `react-dom` to at least 19.2.7.
- [x] Upgrade `@types/react` and `@types/react-dom` to React 19 releases.
- [x] Upgrade `@testing-library/react` to at least 16.3.2.
- [x] Perform an install and run lint, typecheck, and tests.
- [x] Resolve React 19 type errors rather than suppressing them.

No known source migration is required before this step, but the type upgrade
may expose stricter JSX, ref, or event typings.

### 3. Upgrade React Router

- [x] Install `react-router` 8.3.0 or newer.
- [x] Remove `react-router-dom`.
- [x] Change imports from `react-router-dom` to `react-router` in:
  - `src/components/Base.tsx`
  - `src/components/Base.test.tsx`
  - `src/components/Help.tsx`
  - `src/components/Settings.tsx`
  - `src/components/Update.tsx`
  - `src/components/panels/BottomPanel.tsx`
  - `src/components/panels/LeftPanel.tsx`
  - `src/components/panels/RightPanel.tsx`
  - `src/components/widgets/MiniMapCanvas.tsx`
  - `src/components/widgets/MiniMapWrap.tsx`
  - `src/hooks/useQueryParams.ts`
  - `src/hooks/useQueryParams.test.tsx`
- [x] Run focused route and query-parameter tests.
- [x] Confirm there are no imports from `react-router-dom` remaining.

### 4. Browser and deployment verification

- [x] Verify direct URLs for `#/`, `#/settings`, `#/update`, and `#/help`
  through automated route tests.
- [x] Verify hamburger and bottom navigation, back/forward navigation, active
  link styling, and route transitions.
- [x] Verify query parameter reads, writes, removals, and hash-query precedence
  through automated tests.
- [x] Verify lazy-loaded route fallback behavior through automated tests.
- [x] Verify minimap behavior during route changes.
- [ ] Test the production build from the same static hosting paths used by
  NagiosTV deployments.
- [x] Run `npm audit --omit=dev` and confirm the React Router advisory is gone.

## Implemented versions

- Node: 24.18.0
- React and React DOM: 19.2.8
- React Router: 8.3.0
- `@types/react`: 19.2.17
- `@types/react-dom`: 19.2.3
- `@types/node`: 24.13.3
- `@testing-library/react`: 16.3.2
- Production audit: zero vulnerabilities
- Validation: 37 test files and 146 tests passing

## Acceptance criteria

- Node, React, React DOM, React types, Testing Library, and React Router meet the
  target versions above.
- `react-router-dom` is absent from dependencies, the lockfile, and imports.
- `npm run check` passes from a clean install.
- The focused navigation scenarios pass in a real browser.
- The production audit contains no React Router advisory.
- No unrelated major dependency upgrades are included.

## Rollback

If a production-only routing regression appears, revert the React/Router
dependency commit as one unit. Do not downgrade only React Router while leaving
React 19 test/type changes partially applied. The Node runtime increase may
remain if it has already been validated independently.
