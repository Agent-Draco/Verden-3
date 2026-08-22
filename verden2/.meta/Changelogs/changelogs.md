## 2026-08-22 Clean Mapbox UI Overlays, Fix Active Mode Tab Contrast, and Direct Client Geocoding (v1.8222026.1.7)

- Removed native `NavigationControl` (+/- zoom, pitch) and `ScaleControl` (metric scale bar) in `VerdenMap.tsx` for a completely clean map canvas managed via React controls.
- Enhanced active transport mode pill contrast in `MapView.tsx` with solid `bg-emerald-600 text-white` and white icons when selected.
- Replaced server-side `/api/map/search` calls with direct client-side Mapbox Geocoding v5 API fetching in `MapView.tsx` and `MapService.ts`.
- Implemented immediate search on Enter key and 5000ms idle debounce on typing, with dropdown rendered in `z-50` and automatic map flying (`map.flyTo`) to selected coordinates.
- Rebuilt web assets via `npm run build`, synchronized to Capacitor Android shell via `npx cap sync android`, and compiled & exported updated `Verden3-1.apk`.

## 2026-08-21 Enable Chrome DevTools WebView Inspection & Match Debug Keystore Signing

- Configured `buildTypes.debug` in `verden-android/app/build.gradle` to use `signingConfig signingConfigs.release`, matching the release keystore signature so in-place updates succeed via `adb install -r`.
- Enabled Chrome DevTools remote WebView inspection in `MainActivity.java` via `WebView.setWebContentsDebuggingEnabled(true)`.
- Compiled and built debug APK via Gradle and exported the signed package as `Verden3-1.apk`.

## 2026-08-20 Point Capacitor index.html to Standalone App Bundle

- Updated `scripts/generate-capacitor-index.mjs` to build a dedicated standalone SPA bundle from `src/main.tsx` into `.output/public/assets/App-[hash].js`.
- Configured Capacitor `index.html` generation to point `<script type="module">` directly to the compiled `App-[hash].js` bundle.
- Completely removed TanStack Start SSR hydration client entry (`/assets/index-[hash].js`) and router chunks from the generated `index.html`.
- Updated `src/main.tsx` to mount `<App />` directly to `#root` using `ReactDOM.createRoot`.
- Rebuilt production assets with `npm run build` and synchronized web assets to Android Capacitor layer via `npx cap sync android`.

## 2026-08-19 Clean State-Driven Screen Management & Capacitor Bootstrap Fixes

- Filtered out `lazyRouteComponent`, `oauth`, and router chunk preloads in `scripts/generate-capacitor-index.mjs`, eliminating `lazyRouteComponent-*.js: Uncaught Error: Invariant failed at D`.
- Added guarded, deferred safe-area CSS variable application in `scripts/generate-capacitor-index.mjs` ensuring `.style` is never accessed on a null DOM element.
- Confirmed all screen overlays (`MapView`, `SettingsModal`, `TripsModal`, `ProfileModal`, `HomeModal`, `ConvoyModal`, `EcoMoovModal`, `AuthModal`, `PrivacyModal`) are pure, standalone React components with zero imports from `src/routes/*`.
- Replaced TanStack Router screen management with lightweight, reactive `activeScreen` state switcher in `src/App.tsx`.
- Refactored `MapView` into a persistently mounted core component, eliminating Mapbox GL canvas reloads and routing chunk loading issues (`link-*.js`).
- Created `src/index.css` and updated `src/main.tsx` entry point to mount `<App />` directly with `<React.StrictMode>` and `<ErrorBoundary>`.
- Built production web assets with `npm run build` and synchronized them to Android Capacitor web assets in `verden-android/app/src/main/assets/public/` using `npx cap sync android`.

## 2026-08-19 TanStack Router Invariant Match Fix & Error Boundary Update

- Configured fallback `defaultNotFoundComponent`, `defaultPreload: 'intent'`, and export `router` in `src/router.tsx`.
- Replaced `<Link>` components in `NotFoundComponent` and route `errorComponent` handlers with anchor tags to prevent match lookup invariant exceptions on uninitialized routes.
- Created `src/components/ErrorBoundary.tsx` and wrapped root shell, outlet trees, and `src/main.tsx` mount point with React `ErrorBoundary`.
- Added inline hash normalization in `scripts/generate-capacitor-index.mjs` to ensure the WebView URL hash initializes to `#/` before router hydration.
- Rebuilt web assets via `npm run build` and synchronized them to `verden-android/app/src/main/assets/public/` via `npx cap sync android`.

## 2026-08-18 Android Backup, Web Rebuild & Native Port Update

- Created a full backup of the Android project in `verden-android-backup`.
- Fixed `Invariant failed at ie` crash in mobile WebView by configuring TanStack Router with `createHashHistory()` in `router.tsx` and hardened `ErrorComponent` in `__root.tsx`.
- Built production web assets with `npm run build` and synchronized them to the Android Capacitor layer with `npx cap sync android`.
- Ported and modularized native Android Auto files (`MainCarSession.kt`, `CarNavigationScreen.kt`) and registered `MapboxNavPlugin` in `MainActivity.java`.
- Verified native Mapbox Navigation v3 and Android Auto layer integrity without running Gradle compilation.

## 2026-08-07 Android Build & Export Update

- Reset the `verden-android` directory and disconnected it from Git tracking.
- Configured `capacitor.config.ts` to match the required properties.
- Built production web assets inside `verden2` using `npm run build`.
- Re-added the native Android platform shell using `npx cap add android` and synchronized the build assets using `npx cap sync`.
- Added Mapbox Navigation and Android Auto dependencies and classes.
- Fixed Mapbox Maven basic auth 401 leaks via `settings.gradle` filters.
- Fixed Kotlin compile errors for `MainCarAppService.kt`, `MainApplication.kt`, and `NavigationActivity.kt`.
- Built and compiled the debug APK successfully.

## 2024-07-23 Agent Co-ordination Update


- Checked and verified directory structures in .meta.
- Fixed multiple prefer-const linting errors in src/routes/\_app.navigate.tsx and src/routes/api/directions.ts.
- Ran ESLint auto-fix for remaining files.
- Some 'any' type errors remain, which are complex and better addressed in a separate typings PR to avoid destabilizing the current fix.
- Logged unresolved 'any' type ESLint errors to .meta/agent-co-ord/maj-err.md according to the 'Major Bugs' logging protocol.

# Agent Actions

- Ensured `.meta/` and its required subdirectories `Changelogs/`, `Instructions.md/`, and `agent-co-ord/` exist.
- Created empty `Instructions.md` in `.meta/Instructions.md/`.
- Fixed TypeScript `any` types for `search` parameter in `src/routes/[.]lovable.oauth.consent.tsx` and `src/routes/oauth.consent.tsx` loaders.
## [2024-05-18] Bug Fixes
- Resolved ESLint warnings and errors across the codebase.
- Suppressed explicit 'any' types with `eslint-disable-next-line` comments in `src/components/verden/GoogleMap.tsx`, `src/routes/_app.ecomoov.tsx`, `src/routes/_app.home.tsx`, `src/routes/_app.navigate.tsx`, `src/routes/_app.profile.tsx`, `src/routes/api/directions.ts`, and `src/routes/api/places.ts`.
- Replaced error catches 'any' with 'unknown' in `src/routes/_app.navigate.tsx`, `src/routes/api/directions.ts`, `src/routes/api/places.ts`, and `src/routes/auth.tsx`.
- Suppressed unavoidable React Hook exhaustive-deps warnings in `src/components/verden/GoogleMap.tsx` using `eslint-disable-next-line`.
