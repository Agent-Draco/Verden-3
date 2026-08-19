# Changelog

## [2026-08-19] - Clean State-Driven Screen Management Refactor

### Added
- Created persistent `MapView` component in `verden2/src/components/MapView.tsx` maintaining active Mapbox GL canvas context.
- Added responsive overlay modal components: `SettingsModal.tsx`, `TripsModal.tsx`, `ConvoyModal.tsx`, `HomeModal.tsx`, `ProfileModal.tsx`, `EcoMoovModal.tsx`, `AuthModal.tsx`, and `PrivacyModal.tsx`.
- Added `verden2/src/App.tsx` state-driven screen switcher managing active view state without router providers.
- Added `verden2/src/index.css` importing design system stylesheets.

### Fixed
- Eliminated all routing chunk loading exceptions (`link-*.js` and router match lookup failures in mobile WebView).
- Eliminated Mapbox GL canvas unmounting and reload cycles when opening or toggling pages.
- Removed all `@tanstack/react-router` `Link` elements and router navigation hooks, replacing them with fast in-memory state transitions.

### Changed
- Updated `verden2/src/main.tsx` root mount to render `<App />` directly with `<React.StrictMode>` and `<ErrorBoundary>`.
- Rebuilt frontend web assets with `npm run build` and synchronized them to Capacitor Android web assets in `verden-android/app/src/main/assets/public/` using `npx cap sync android`.

## [2026-08-19]


### Added
- Added `ErrorBoundary` component in `verden2/src/components/ErrorBoundary.tsx` to trap uncaught routing exceptions and prevent blank white screens in Capacitor WebView.
- Added `verden2/src/main.tsx` root mounting entry with `ErrorBoundary` and `RouterProvider`.

### Fixed
- Fixed TanStack Router `Invariant failed at ie (link-*.js)` match failure in Capacitor WebView by configuring `defaultPreload: 'intent'` and fallback `defaultNotFoundComponent` in `verden2/src/router.tsx`.
- Replaced `<Link>` component with safe anchor tags inside `NotFoundComponent` and route `errorComponent` handlers (`__root.tsx`, `oauth.consent.tsx`, `[.]lovable.oauth.consent.tsx`), eliminating match lookup invariant violations on uninitialized/not-found paths.
- Added inline URL hash normalization script in `generate-capacitor-index.mjs` ensuring initial hash route `#/` is set before React and TanStack Router hydration starts.
- Wrapped root shell and outlet trees in `__root.tsx` with `<ErrorBoundary>`.

### Changed
- Rebuilt web bundle via `npm run build` and synchronized updated assets to `verden-android/app/src/main/assets/public/` via `npx cap sync android`.

## [2026-08-18]

### Added
- Created complete backup of the Android platform directory at `verden-android-backup`.
- Added modularized native Android Auto source files: `MainCarSession.kt` and `CarNavigationScreen.kt`.
- Registered `MapboxNavPlugin` explicitly in `MainActivity.java`.

### Fixed
- Resolved `Invariant failed at ie` crash in mobile WebView by configuring TanStack Router with `createHashHistory()` for Capacitor environment.
- Hardened `ErrorComponent` in `__root.tsx` to prevent calling `useRouter()` outside valid router context and surfaced readable error messages.

### Changed
- Rebuilt frontend web distribution bundle via `npm run build` in `verden2` and synchronized assets to `verden-android` via `npx cap sync android`.
- Verified native Mapbox Navigation v3 and Android Auto layer integrity across Gradle configurations, manifests, resources, and Kotlin source files.

## [2026-08-07]

### Added
- Created a fresh native Android platform shell via `npx cap add android` and synchronized compiled SPA assets via `npx cap sync`.
- Integrated Mapbox Navigation SDK and Android Auto dependencies.
- Added native Kotlin components: `MainApplication.kt`, `MapboxNavPlugin.kt`, `NavigationActivity.kt`, and `MainCarAppService.kt`.
- Successfully compiled the Android application and generated `app-debug.apk` via `./gradlew assembleDebug`.

### Fixed
- Fixed Mapbox 401 basic authentication error by declaring exclusive repository routing filters in `settings.gradle`.
- Fixed Kotlin compilation errors in `MainCarAppService.kt` (implemented `createHostValidator()`, removed illegal `finish()` calls), `MainApplication.kt`, and `NavigationActivity.kt` (programmatically configured Mapbox token using `MapboxOptions.accessToken`).
- Added missing `local.properties` and local `gradle.properties` configs.

## [2026-08-02]

### Added
- Created a database schema and migration script for `public.verden3_waitlist` with RLS policies, unique constraints, and referral tracking support.
- Added Wave Zero Waitlist integration to the React/Vite dashboard.
- Implemented referral query parameter tracking (`?ref=...`) saving referrers to localStorage for signup attribution.
- Created dynamic queue position calculations and real-time referral counting on the client dashboard.

## [2026-07-23]

### Added
- Created the native Android Auto Navigation project inside `/verden-android/`.
- Configured Gradle wrapper, build scripts, setting properties, and local Android SDK dependencies.
- Added `MainActivity.kt` with high-accuracy GPS tracking and sequential location permission flow.
- Added `MyCarAppService.kt` and `CarMapSession.kt` to initialize the Android Auto connection.
- Added `MapScreen.kt` for rendering the map WebView onto the car display surface.
- Added `SearchScreen.kt` for native keyboard/voice destination lookup.
- Added `TokenListScreen.kt` to view/select active vehicles.
- Created `/car-map` route in React application with full-viewport canvas and JavaScript interface.
- Enabled Web Contents Debugging via `setWebContentsDebuggingEnabled(true)` in `MainActivity.kt` to allow Chrome inspect.
- Added network state and cleartext permissions (`usesCleartextTraffic="true"`, `ACCESS_NETWORK_STATE`) in `AndroidManifest.xml`.

### Fixed
- Fixed JVM compilation errors caused by Java 25 by installing and configuring Adoptium JDK 17 locally.
- Solved Gradle TLS/SSL PKIX path building errors by importing certificates for `dl.google.com` and `repo.maven.apache.org` into the JVM truststore.
- Corrected `androidx.car.app` dependencies and API signatures (e.g. `onScroll`).
- Cleaned ESLint static analysis findings in `car-map.tsx`.
- Configured WebView settings (`domStorageEnabled`, `databaseEnabled`, `allowFileAccess`, `javaScriptCanOpenWindowsAutomatically`) in `MainActivity.kt`.
