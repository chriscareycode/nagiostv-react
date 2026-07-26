# NagiosTV Agent Instructions

## Project

NagiosTV is a GPL-2.0 React and TypeScript single-page dashboard for Nagios
Core 4, Nagios XI, and MK Livestatus. It presents host and service status,
alerts, history, sound effects, and optional local LLM summaries. The UI is
intended for wall-mounted displays as well as desktop and mobile browsers.

## Stack

- React 18 with TypeScript strict mode and Vite
- Jotai for global state
- React Router v6 with `HashRouter`
- Tailwind CSS v4 plus co-located component CSS
- Motion for animation
- Axios for HTTP, Luxon for dates, Highcharts for charts, and FontAwesome icons
- Vitest, React Testing Library, and jsdom for tests

## Commands

```bash
npm start              # Vite development server on port 3015
npm run lint           # ESLint
npm run typecheck      # TypeScript without emitting files
npm run test:no-watch  # Run the test suite once
npm run build          # Production build in build/
npm run check          # Run all validation above
npm run proxy          # Optional Nagios development proxy
```

Use non-watch commands when validating automated changes. Run focused tests
while iterating and `npm run check` before handing off substantial changes.

## Repository Map

- `src/atoms/`: Jotai state. `settingsState.ts` contains `bigStateAtom`,
  `clientSettingsAtom`, and defaults.
- `src/components/`: UI organized by feature. Data fetching lives primarily in
  `hosts/HostSection.tsx`, `services/ServiceSection.tsx`,
  `alerts/AlertSection.tsx`, and `DashboardFetch.tsx`.
- `src/helpers/`: shared data conversion, Nagios mappings, colors, i18n, dates,
  HTTP error handling, and audio.
- `src/hooks/` and `src/effects/`: reusable hooks and side effects.
- `src/types/`: shared TypeScript interfaces.
- `public/`: static assets, sample data, audio, and connector scripts.
- `node/`: optional backend proxy.
- `build/`: committed production output. Update it only when the requested work
  calls for a production build artifact.

## Architecture

- Keep global state in Jotai atoms; do not introduce another state library.
  Prefer `useAtomValue` for reads, `useSetAtom` for writes, and `useAtom` only
  when both are needed.
- `ClientSettings` is defined in `src/types/settings.ts`; its defaults are in
  `clientSettingsInitial` in `src/atoms/settingsState.ts`. Update both when
  adding a setting.
- Settings may come from `client-settings.json`, browser storage, or legacy
  cookies. Preserve the configured precedence behavior.
- Hosts and services poll Nagios independently. `DashboardFetch` fetches
  hostgroups, comments, and program status.
- Nagios host status codes are `1=pending`, `2=up`, `4=down`,
  `8=unreachable`. Service codes are `1=pending`, `2=ok`, `4=warning`,
  `8=unknown`, `16=critical`. State type is `0=soft`, `1=hard`.
- PWA/service-worker support is intentionally disabled so monitoring data and
  application updates stay fresh.

## Code Conventions

- Prefer functional components and hooks. Some legacy class components remain;
  do not convert them unless the task requires it.
- Follow the surrounding code's naming and formatting. Components use
  `PascalCase.tsx`; component CSS is normally co-located.
- Use configured aliases such as `atoms/*`, `components/*`, `helpers/*`,
  `types/*`, and `widgets/*` instead of long upward relative imports.
- Keep shared types in `src/types/`; component-only prop interfaces may remain
  with the component.
- Use `translate()` from `helpers/language.ts` for user-facing text. Language
  packs live in `src/helpers/languages/`.
- Preserve the GPL-2.0 header used by source files when adding new source code.
- Do not convert unrelated code, regenerate unrelated output, or broaden a
  focused change.

## Development Modes

- `?fakedata=true`: use `public/sample-data/`
- `?demo=true`: run simulated demo events
- `?debug=true`: enable extra diagnostics
- `?stresstest=true`: enable stress-test behavior

## Commits

When asked to commit:

- Include only files related to the requested work and stage paths explicitly.
- Do not use `git add .` or `git add -A` in a worktree that may contain
  unrelated changes.
- Use Conventional Commits syntax, for example
  `fix: correct Highcharts React import`.
