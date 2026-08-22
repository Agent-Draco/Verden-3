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
