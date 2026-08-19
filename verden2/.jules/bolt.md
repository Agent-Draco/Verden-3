## 2024-05-24 - React rendering & Maps performance

**Learning:** Passing inline arrays (e.g. `alternativeRoutes={[...]}`) to heavy components like `GoogleMap` causes unnecessary re-renders and re-triggering of `useEffect` hooks, leading to expensive maps re-draws (polylines/markers) when other non-related states change.
**Action:** Always memoize arrays and objects passed as props to components that use them in their dependency arrays, especially for heavy external API components like Google Maps or 3D renderers.

## 2024-06-20 - GPS Tracking Loop Optimization

**Learning:** In navigation components (like `_app.navigate.tsx`), running an O(N) loop to calculate remaining distance on every single high-frequency geolocation update creates a significant performance bottleneck, especially on mobile devices processing large polyline arrays.
**Action:** Always pre-calculate static values (like cumulative distances from polyline endpoints) using `useMemo` when routes are generated, so high-frequency tick handlers can do O(1) array lookups instead of O(N) recalculations.
## 2026-07-25 - React render loop performance with complex list state
**Learning:** In community or data-heavy views (like `_app.ecomoov.tsx`), iterating through all member associations using nested loops (e.g. `groupList.forEach` containing `allMembers.filter`) causes an O(N×M) bottleneck that locks up the main UI thread during load.
**Action:** Always pre-process relational array data into O(1) hash maps or initialize single-pass aggregations (O(N+M)) before calling state setter functions to prevent UI blocking.
