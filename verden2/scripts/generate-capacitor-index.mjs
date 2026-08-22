/**
 * Generates .output/public/index.html as the Capacitor WebView entry point.
 *
 * TanStack Start builds an SSR server (no static index.html), but Capacitor
 * requires one in webDir. This reads the built Start manifest to find the
 * hashed client entry script and root stylesheet, then writes an SPA shell.
 *
 * Runs automatically after `npm run build` (see the "postbuild" script).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDir = ".output";
const publicDir = join(outputDir, "public");
const serverDir = join(outputDir, "server");

const manifestFile = readdirSync(serverDir).find((f) => f.startsWith("_tanstack-start-manifest"));
if (!manifestFile) {
  console.error("Could not find TanStack Start manifest in .output/server");
  process.exit(1);
}
const manifest = readFileSync(join(serverDir, manifestFile), "utf8");

const rootSection = manifest.slice(manifest.indexOf("__root__"));
const scriptMatch = rootSection.match(/src:\s*"(\/assets\/[^"]+\.js)"/);
if (!scriptMatch) {
  console.error("Could not find client entry script in Start manifest");
  process.exit(1);
}
const entryScript = scriptMatch[1];

const preloads = [
  ...rootSection.slice(0, rootSection.indexOf("scripts:")).matchAll(/"(\/assets\/[^"]+\.js)"/g),
]
  .map((m) => m[1])
  .filter((p) => p !== entryScript);

const cssFiles = readdirSync(join(publicDir, "assets")).filter(
  (f) => f.startsWith("styles-") && f.endsWith(".css"),
);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Verden Maps</title>
    <link rel="icon" href="/favicon.ico" />
    <script>
      if (!window.location.hash || window.location.hash === '#' || window.location.hash === '') {
        window.location.hash = '#/';
      }
    </script>
${cssFiles.map((f) => `    <link rel="stylesheet" href="/assets/${f}" />`).join("\n")}
${preloads.map((p) => `    <link rel="modulepreload" href="${p}" />`).join("\n")}
  </head>
  <body class="bg-transparent text-foreground overflow-hidden" style="background-color: transparent;">
    <div id="root" style="width: 100vw; height: 100vh; overflow: hidden; background-color: transparent;"></div>
    <script type="module" async src="${entryScript}"></script>
  </body>
</html>
`;

writeFileSync(join(publicDir, "index.html"), html);
console.log(`Generated ${join(publicDir, "index.html")} (entry: ${entryScript})`);
