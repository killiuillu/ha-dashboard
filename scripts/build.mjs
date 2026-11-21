import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

const mode = process.argv.includes("--watch") ? "watch" : process.argv.includes("--check") ? "check" : "build";

const options = {
  entryPoints: [resolve(root, "src/index.js")],
  bundle: true,
  format: "iife",
  target: ["es2022"],
  legalComments: "none",
  charset: "utf8",
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  banner: {
    js: `/* evcc-Dashboard ${pkg.version} – gebaut aus src/ (npm run build). Nicht von Hand bearbeiten. */`,
  },
  logLevel: "info",
};

if (mode === "watch") {
  const ctx = await esbuild.context({ ...options, outfile: resolve(root, "dist/ha-dashboard.js") });
  await ctx.watch();
} else if (mode === "check") {
  await esbuild.build({ ...options, write: false, logLevel: "warning" });
  console.log("Build ok");
} else {
  await esbuild.build({ ...options, outfile: resolve(root, "dist/ha-dashboard.js") });
}
