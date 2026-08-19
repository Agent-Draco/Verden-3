# Changelog - Verden Maps Improvements

## [2026-07-20]

### Added
- **OpenAPI 3.0 Specification Update (`openapi.json`)**:
  - Updated `securitySchemes.oauth2.flows.authorizationCode.authorizationUrl` in [openapi.json](file:///c:/Users/Malav%20Patel/Downloads/Verden%20Maps/verden2/wrapper/openapi.json) to point to `https://verden2.lovable.app/oauth/authorize`.
  - Added public static spec at `verden2/public/openapi.json` for ChatGPT Custom GPT Actions auto-discovery.
- **Standard OAuth 2.0 Authorization Endpoint (`/oauth/authorize`) & Consent Fallback**:
  - Implemented standard OAuth 2.0 Authorization Endpoint at `GET /oauth/authorize` to support external OAuth 2.0 clients such as ChatGPT Custom GPT Actions.
  - Updated `/oauth/consent` and `/.lovable/oauth/consent` to detect when OAuth query parameters (`client_id`, `redirect_uri`, etc.) are passed directly without an `authorization_id`, automatically generating the `authorization_id` via Supabase Auth server so Lovable and external OAuth clients load the consent page cleanly without errors.
  - Added full validation for query parameters (`client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`, `code_challenge`, `code_challenge_method`).
  - Integrated Supabase session authentication check; unauthenticated users are redirected to `/auth` with resume return parameter (`next`).
  - Maintained full backwards compatibility with existing MCP authorization flows and `/oauth/consent` consent logic.
- **Privacy Policy Page (`/privacy-policy`)**:
  - Created a dedicated, publicly accessible Privacy Policy route at `/privacy-policy`.
  - Implemented interactive table of contents with smooth scrolling to sections and live keyword topic search.
  - Formulated detailed disclosures covering GPS location telemetry rules, vehicle specification data math, 3D WebGL client processing, Supabase & Google Maps SDK third-party integrations, local storage policies, and GDPR/CCPA user data rights.
  - Linked Privacy Policy in landing page (`/`), authentication page (`/auth`), and application sidebar (`Shell.tsx`).

### Fixed
- **Server Directions Route Fix (`/api/route`)**:
  - Corrected `createFileRoute` definition in [route.ts](file:///c:/Users/Malav%20Patel/Downloads/Verden%20Maps/verden2/src/routes/api/route.ts) from `/api` to `/api/route`.
  - Updated [routeTree.gen.ts](file:///c:/Users/Malav%20Patel/Downloads/Verden%20Maps/verden2/src/routeTree.gen.ts) so direction calculations invoked via POST `/api/route` resolve correctly.
- **3D WebGL GLB Loader URL Encoding**:
  - Updated model loading paths in [GoogleMap.tsx](file:///c:/Users/Malav%20Patel/Downloads/Verden%20Maps/verden2/src/components/verden/GoogleMap.tsx) to explicitly URL-encode space characters in `/3D Files/` using `encodeURI`, resolving GLB asset fetch failures.
- **Splash Branding Alignment**:
  - Updated hero badge text in [index.tsx](file:///c:/Users/Malav%20Patel/Downloads/Verden%20Maps/verden2/src/routes/index.tsx) to read `"Powered by Google Maps"`.
- **MCP `unlock_car_with_quiz` Vehicle Display Name Support**:
  - Updated [unlock-car-with-quiz.ts](file:///c:/Users/Malav%20Patel/Downloads/Verden%20Maps/verden2/src/lib/mcp/tools/unlock-car-with-quiz.ts) to accept garage display names (e.g., `"Future Race Car"`, `"Luxury SUV"`, `"Sports Sedan"`).
  - Listed all available garage vehicles by display name in tool descriptions and enhanced name lookup to seamlessly resolve display names, GLB filenames, and base model IDs.
- **Shell Component Syntax Error (`Shell.tsx`)**:
  - Resolved unresolved git merge conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) in [Shell.tsx](file:///c:/Users/Malav%20Patel/Downloads/Verden%20Maps/verden2/src/components/verden/Shell.tsx) that broke Vite transform/module parsing.
  - Retained the Privacy Policy sidebar link and Google Maps SDK footer.

## [2026-07-18]

### Added
- **3D WebGL Map Tokens**:
  - Integrated Three.js inside Google Maps `WebGLOverlayView` to render the user's selected 3D vehicle at userLocation, rotating smoothly to point along travel heading.
  - Spanned 3D collectible items (like Mystery Boxes and racing karts) along routes, which unlock models in the user's garage when approached within 35 meters.
- **Custom Vehicle Specifications Form**:
  - Added mileage (km/L) and fuel type fields in Profile to customize navigation CO₂ calculations using exact fuel multipliers (Petrol, Diesel, Hybrid, Electric).
- **Vehicle Garage**:
  - Added a grid interface for selecting from 26 unlocked car models with standard category names. Unlocked standard Sedan for everyone, plus 8 premium vehicles free for Malav Patel.
- **AI Quiz Backdoor**:
  - Created `unlock_car_with_quiz` MCP tool to let external AI clients unlock cars. Added a floating AI Assistant chatbot widget in the app shell to interactively prompt and execute this tool.
- **EcoMoov Active Chats & Suggestions**:
  - Divided EcoMoov page into active joined carpool groups (featuring coordination chat saved in localStorage) on top, and route suggestion recommendations below.
  - Added matches alert banners on the Home page dashboard.
- **Consent Page Relocation**:
  - Moved consent route from `/.lovable/oauth/consent` to `/oauth/consent`.
- **Landing Page Theme Alignment**:
  - Redesigned `index.tsx` landing page to use the white/misty background eco-theme of `/home`, incorporating clean white card designs, glowing stat pulses, and animated hover effects.
- **Remotion Animation Setup**:
  - Initialized a blank Remotion project in `remotion-project/` to handle offline rendering of short video animations.
  - Designed and rendered a custom logo splash animation to `verden2/public/intro.mp4`.
- **Boot/Dashboard Loader**:
  - Configured `_app.home.tsx` to display `intro.mp4` on page bootstrap while loading Supabase profile and challenge details, featuring a smooth fade out and skip button. The landing page splash loading remains exactly as is.
- **Database Schema Upgrades**:
  - Added `polyline` (TEXT) and `greenery_score` (NUMERIC) columns to the `public.trips` table in the Supabase database.

### Changed
- **Location-Aware Dense Searches**:
  - Updated `/api/places` POST endpoint to accept device coordinates and bias places search within a 30km radius using `locationBias`.
  - Increased Places max results to `15` and requested extra fields: `places.rating`, `places.userRatingCount`, `places.types`.
  - Redesigned search dropdown in `_app.navigate.tsx` to display ratings, reviews, category tags, and custom icons.
- **Multi-Route Calculations**:
  - Restructured `/api/route` to compute alternative routes and Google eco-friendly reference paths (`FUEL_EFFICIENT`).
  - Added local green space (parks, forests, reserves) search within the routes' bounding box using Places API, computing proximity-based `greenery_score` for each path.
  - Formulated 4 route choices: **Speed** (fastest), **Fuel** (lowest fuel/CO2), **Green** (scenic/tree coverage), and **Balance** (weighted best-mix).
- **Google Maps HUD & Routing Visuals**:
  - Modified `GoogleMap.tsx` to support user location markers, heading rotations, multiple route overlays, and green leaf marker icons along the scenic eco route.
  - Enabled active map panning/centering on GPS coordinates during navigation.
- **Real-Time GPS turn-by-turn Navigation HUD**:
  - Redesigned navigation HUD in `_app.navigate.tsx` to track positions using `navigator.geolocation.watchPosition`.
  - Integrated Text-to-Speech (TTS) turn-by-turn alerts via Web Speech API and transitions between route steps.
  - Integrated auto-arrival detection (<35m) that saves the route's polyline and greenery score to Supabase and shows a success medal screen.
  - Included a collapsible testing widget to drag coordinates or "Auto-drive" to mock GPS positioning directly at the desk.
