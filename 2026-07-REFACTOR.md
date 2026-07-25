# July 2026 Refactoring Checklist

This document records the findings from the July 2026 read-only project review. Items are ordered roughly by risk and expected value.

## Priority 1: Correctness and lifecycle

- [x] Fix program-status error handling in `src/components/DashboardFetch.tsx`.
  - A non-JSON program-status response currently updates `servicegroupAtom`.
  - Update `programStatusAtom` instead and correct the misleading service-group log message.
  - Add a regression test covering a non-JSON program-status response.

- [x] Fix stale settings captured by polling effects.
  - Audit `DashboardFetch`, `HostSection`, `ServiceSection`, and `AlertSection`.
  - Include every request-affecting value in effect dependencies, or encapsulate polling in a hook with stable callbacks.
  - Cover at least:
    - `baseUrl`
    - `livestatusPath`
    - `dataSource`
    - polling frequencies
    - host and service group filters
    - host/service visibility filters that affect server queries
    - `alertDaysBack`
    - `alertMaxItems`
    - demo and fake-data modes
  - Verify that saving new connection settings changes the next request without requiring a remount.

- [x] Replace module-level and render-local `isComponentMounted` flags.
  - Module-level flags in `HostSection`, `ServiceSection`, and `AlertSection` are shared across component instances and effect generations.
  - The render-local flag in `Settings.tsx` is recreated on every render.
  - Prefer aborting requests and cancelling timers. Use a per-effect ref only where an additional mounted check is still necessary.

- [x] Cancel obsolete Axios requests.
  - Use `AbortController` for host, service, alert, group, comment, and program-status requests.
  - Abort requests during effect cleanup and when request-affecting settings change.
  - Ensure an older response cannot overwrite data from a newer request.
  - Treat cancellation separately from a genuine connection error.

- [x] Guard fake-alert timestamp adjustment against an empty alert list.
  - `AlertSection` currently reads `myAlertlist[0].timestamp` without first checking that an item exists.
  - Add a test for an empty fake alert response.

## Priority 2: Restore quality gates

- [x] Restore the Vitest setup.
  - Add the missing `src/setupTests.ts`, or remove the stale `setupFiles` entry from `vite.config.ts`.
  - Ensure `@testing-library/jest-dom` is initialized for Vitest.
  - Confirm `npm run test:no-watch` starts and completes successfully.

- [x] Make strict TypeScript checking pass.
  - Add an explicit `typecheck` script using `tsc --noEmit`.
  - Update `moduleResolution` to an option compatible with the current Vite/Vitest packages, likely `bundler`.
  - Resolve the Jest type conflict introduced by the current testing-library type setup.
  - Replace browser-side `NodeJS.Timeout` declarations with `ReturnType<typeof setTimeout>` or `ReturnType<typeof setInterval>`.
  - Type currently implicit values such as `AppContext` children, `Clock` props, color helpers, date helpers, and language helpers.
  - Safely normalize or inspect Axios `content-type` headers instead of calling `indexOf` on the full header union type.
  - Do not hide project errors by broadly disabling strictness.

- [x] Add ESLint and React Hooks validation.
  - Add scripts suitable for local development and CI.
  - Enable `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`.
  - Address warnings in polling effects rather than suppressing them.
  - Polling components enforce exhaustive dependencies as errors; remaining legacy hook findings are reported as warnings for later cleanup.

- [x] Expand meaningful automated coverage.
  - Replace or supplement the current single shallow application test.
  - Prioritize request URL construction, polling cleanup, stale-response prevention, content-type failures, settings changes, and empty API responses.

- [x] Add a single CI/check command.
  - Run type-checking, linting, non-watch tests, and the production build.
  - Document the command in the development README.

## Priority 3: Timer and state cleanup

- [x] Audit every timeout and interval for cleanup.
  - Known candidates include `DashboardFetch`, `SettingsFakeData`, `Demo`, `HowManyEmoji`, `Doomguy`, and minimap components.
  - `SettingsFakeData` clears its interval but not its initial timeout.
  - `DashboardFetch` does not clear its delayed initial fetches.
  - Store multiple demo timers together so cleanup is reliable and easy to review.
  - Audited remaining timers in panels, summary, audio, LLM, minimap, charts, scrolling, and status widgets; added cancellation for the remaining delayed callbacks.

- [x] Avoid mutating nested atom state in `SettingsFakeData`.
  - It currently copies the host/service arrays but mutates the objects inside those arrays.
  - Create new objects only for entries whose `next_check` changes.

- [x] Centralize persisted settings access.
  - Consolidate repeated `localStorage` parsing, serialization, error handling, and fallback behavior.
  - Define typed storage keys and schemas for settings, skipped versions, and version-check timestamps.
  - Remove temporary/debug logging from normal save paths.
  - Added validated localStorage access, cookie fallback and migration, and tests for malformed, blocked, and legacy storage scenarios.

## Priority 4: Reduce duplication and component size

- [x] Extract shared polling and request infrastructure.
  - Host, service, alert, group, comment, and program-status flows repeat URL selection, timeouts, content-type validation, error handling, scheduling, and atom updates.
  - Introduce small typed utilities or hooks rather than one highly configurable monolith.
  - Keep endpoint-specific response transformation explicit and testable.
  - Centralized delayed polling, interval validation, request cancellation, JSON response validation, and error classification in tested helpers; response transformation remains endpoint-specific.

- [x] Extract shared Nagios URL construction.
  - Encode query parameters safely rather than concatenating raw filter strings.
  - Support both statusjson and livestatus sources through typed builders.
  - Unit-test hostgroup and servicegroup filters containing reserved URL characters.
  - Added a typed query-to-CGI mapping and migrated host, service, alert, group, comment, and program-status requests.

- [x] Split `Settings.tsx`.
  - The component is currently over 1,200 lines.
  - Extract cohesive sections such as data source, display, hosts, services, alerts/history, audio/speech, minimap, LLM, and persistence actions.
  - Consider typed field descriptors for repetitive inputs while retaining custom components for complex settings.
  - Extracted typed data-source/connection, date/region, display/minimap, alert-history, audio/visual, menu/logo, LLM, and persistence sections with reusable controls and focused interaction tests.

- [x] Split other large, multi-responsibility components.
  - Review `LocalLLM`, `Update`, `SettingsLoad`, `HistoryChart`, and `Demo`.
  - Separate network/state orchestration from display components and pure data transformation.
  - Preserve existing uncommitted `LocalLLM.tsx` work while planning or implementing this item.
  - [x] Extract `Update` HTTP/state orchestration into a dedicated, cancellable hook.
  - [x] Extract `SettingsLoad` version-check scheduling and request lifecycle into a tested hook.
  - [x] Extract `HistoryChart` alert aggregation and layout calculations into pure, tested helpers.
  - [x] Extract `Demo` scenario transitions and timer orchestration into tested helpers and a hook.
  - [x] Extract `LocalLLM` prompt construction, monitoring serialization, and response parsing into tested helpers.
  - [x] Extract `LocalLLM` backend transport, compatibility retry, and response normalization.
  - [x] Extract `LocalLLM` history storage, navigation, and current-response synchronization.
  - [x] Extract `LocalLLM` analysis execution, automatic triggers, cancellation, and timer cleanup into a controller hook.

- [x] Consolidate parallel host and service implementations where the behavior is genuinely shared.
  - Candidate areas include polling lifecycle, filters, item lists, counters, and error presentation.
  - Do not erase meaningful host/service domain differences merely to reduce line count.
  - [x] Use shared visibility helpers for host/service item lists and centralize common state predicates.
  - [x] Consolidate host/service counters around shared monitoring-state predicates.
  - [x] Share host/service sorting mechanics while retaining domain-specific name ordering.
  - [x] Extract the shared animated item-list shell while retaining domain-specific rows.
  - [x] Centralize monitoring error visibility and presentation across dashboard sections.

## Priority 5: Performance and dependency hygiene

- [x] Add route-level code splitting.
  - Lazy-load Settings, Update, and Help routes.
  - Consider lazy-loading optional heavy dashboard features such as Highcharts history, minimap capture, and local LLM functionality.
  - Measure before and after. The reviewed production build emitted approximately 1.48 MB of minified JavaScript, about 500 KB gzip.
  - Lazy-loaded Settings, Update, and Help while keeping the primary dashboard eager.
  - The July implementation reduced initial JavaScript from 1,406.02 kB / 466.62 kB gzip to 1,356.57 kB / 455.75 kB gzip; 51.67 kB / 13.84 kB gzip moved into route chunks.

- [x] Review minimap snapshot scheduling.
  - Several independent effects can request snapshots close together.
  - Route all requests through one debounced or queued scheduler.
  - Prevent concurrent snapshots and discard obsolete results.
  - Added a tested generation-aware scheduler that coalesces bursts, queues during capture, and applies only the newest result.

- [x] Reconcile declared and installed tool versions.
  - The reviewed local installation had Vite 6 and plugin-react 4 while `package.json` requested Vite 8 and plugin-react 6.
  - Perform a clean, reproducible install and commit the resulting lockfile only after verifying the supported Node version.
  - Verified with `npm ci`, Node 24.16.0, Vite 8.0.16, and plugin-react 6.0.2.

- [x] Audit dependencies and legacy compatibility.
  - Verify whether `styled-components` is unused and remove it if so.
  - Decide whether IE 11 remains supported.
  - If IE 11 is not supported, remove obsolete React and URL search-parameter polyfills and update `browserslist`.
  - If it is supported, reconcile that requirement with the current `ESNext` target and modern Vite toolchain.
  - Confirmed `styled-components` was unused and removed it.
  - Ended the contradictory IE 11 path to match React 18, Vite 8, and the ESNext target; removed legacy polyfills and the IE-only development browserslist entry.
  - Removing the unused dependencies and eagerly loaded polyfills reduced initial JavaScript by another 175.33 kB / 60.81 kB gzip.

## Validation baseline

At the time of review:

- `npm run build` succeeded, with a large-chunk warning.
- `npm run test:no-watch` failed because `src/setupTests.ts` was missing.
- `npx tsc --noEmit` failed with configuration, dependency-type, and source-type errors.
- `npm ls vite vitest @vitejs/plugin-react --depth=0` reported installed Vite/plugin-react versions that did not satisfy `package.json`.

No implementation work should be considered complete until the relevant behavior is covered by tests and the applicable validation commands pass.

## Follow-up cleanup

- [x] Resolve the remaining React Hook warnings without suppressing lint rules.
  - Stabilized Doomguy animation data and minimap resize callbacks.
  - Fixed automatic-scroll memoization so speed and wait-setting changes take effect.

- [x] Lazy-load optional heavy dashboard features.
  - Deferred the minimap stack until enabled and Highcharts until alert history charts render.
  - Reduced initial JavaScript from 1,182.15 kB / 395.21 kB gzip to 745.72 kB / 244.49 kB gzip.
  - Moved 437.00 kB / 151.81 kB gzip into optional minimap and history-chart chunks.
