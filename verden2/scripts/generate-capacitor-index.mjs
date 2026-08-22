/**
 * Generates .output/public/index.html as the Capacitor WebView entry point.
 *
 * Compiles a dedicated standalone SPA bundle from src/main.tsx into
 * .output/public/assets/App-[hash].js, bypassing TanStack Start SSR hydration
 * and TanStack Router to prevent lazyRouteComponent invariant failures in WebView.
 *
 * Runs automatically after `npm run build` (see the "postbuild" script).
 */
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const outputDir = ".output";
const publicDir = join(outputDir, "public");
const assetsDir = join(publicDir, "assets");

// 1. Build dedicated standalone SPA bundle from src/main.tsx
console.log("Building standalone Capacitor SPA bundle from src/main.tsx...");
const buildResult = await build({
  configFile: false,
  publicDir: false,
  resolve: { tsconfigPaths: true },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: publicDir,
    emptyOutDir: false,
    rollupOptions: {
      input: {
        App: "src/main.tsx",
      },
      output: {
        entryFileNames: "assets/App-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});

// 2. Inspect .output/public/assets/ to determine bundle entry and assets
const assetFiles = readdirSync(assetsDir);

let entryScript = null;
if (Array.isArray(buildResult)) {
  for (const res of buildResult) {
    const chunk = res.output?.find((o) => o.isEntry && o.fileName.startsWith("assets/App-"));
    if (chunk) {
      entryScript = `/${chunk.fileName}`;
      break;
    }
  }
} else if (buildResult?.output) {
  const chunk = buildResult.output.find((o) => o.isEntry && o.fileName.startsWith("assets/App-"));
  if (chunk) {
    entryScript = `/${chunk.fileName}`;
  }
}

// Fallback: inspect assets directory directly
if (!entryScript) {
  const appFile = assetFiles.find((f) => f.startsWith("App-") && f.endsWith(".js"));
  if (appFile) {
    entryScript = `/assets/${appFile}`;
  }
}

if (!entryScript) {
  console.error("Could not find compiled App bundle in .output/public/assets");
  process.exit(1);
}

// Gather all CSS files (e.g. styles-*.css, app-*.css, VerdenMap-*.css)
const cssFiles = assetFiles.filter((f) => f.endsWith(".css"));

// Gather preloadable chunks (exclude index-*, lazyRouteComponent, oauth, routes, router, etc.)
const preloads = assetFiles
  .filter(
    (f) =>
      f.endsWith(".js") &&
      `/assets/${f}` !== entryScript &&
      !f.startsWith("index-") &&
      !f.includes("lazyRouteComponent") &&
      !f.includes("oauth") &&
      !f.includes("routes-") &&
      !f.includes("router-") &&
      !f.includes("_app") &&
      !f.includes("auth-") &&
      !f.includes("privacy-policy-")
  )
  .map((f) => `/assets/${f}`);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Verden Maps</title>
    <link rel="icon" href="/favicon.ico" />
    <script>
      (function() {
        if (!window.location.hash || window.location.hash === '#' || window.location.hash === '') {
          window.location.hash = '#/';
        }
        function applySafeArea() {
          try {
            var el = document.getElementById('root') || document.body || document.documentElement;
            if (el && el.style) {
              el.style.setProperty('--sat', 'env(safe-area-inset-top, 0px)');
              el.style.setProperty('--sab', 'env(safe-area-inset-bottom, 0px)');
              el.style.setProperty('--sal', 'env(safe-area-inset-left, 0px)');
              el.style.setProperty('--sar', 'env(safe-area-inset-right, 0px)');
            }
          } catch (e) {
            console.warn('Safe area CSS injection deferred:', e);
          }
        }
        if (document.readyState === 'loading') {
          window.addEventListener('DOMContentLoaded', applySafeArea);
        } else {
          applySafeArea();
        }
      })();
    </script>
${cssFiles.map((f) => `    <link rel="stylesheet" href="/assets/${f}" />`).join("\n")}
${preloads.map((p) => `    <link rel="modulepreload" href="${p}" />`).join("\n")}
  </head>
  <body class="bg-background text-foreground overflow-hidden">
    <div id="root" style="width: 100vw; height: 100vh; overflow: hidden;"></div>
    <script type="module" async src="${entryScript}"></script>
  </body>
</html>
`;

writeFileSync(join(publicDir, "index.html"), html);
console.log(`Generated ${join(publicDir, "index.html")} (entry: ${entryScript})`);

